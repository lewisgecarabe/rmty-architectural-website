<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\SmsController;
use App\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendDailyAppointmentReminders extends Command
{
    protected $signature = 'reminders:send-daily
        {--debug : Show detailed debug information.}
        {--dry-run : Preview matching consultations without sending SMS.}';

    protected $description = 'Send daily automated SMS reminders for today’s accepted/rescheduled consultations.';

    public function handle(): int
    {
        $timezone = 'Asia/Manila';

        $now = Carbon::now($timezone);
        $targetDate = Carbon::today($timezone)->toDateString();

        $this->info('Daily Appointment Reminder System');
        $this->line("Now: {$now->toDateTimeString()} ({$timezone})");
        $this->line("Target date: {$targetDate}");
        $this->line('Dry run: ' . ($this->option('dry-run') ? 'YES' : 'NO'));
        $this->newLine();

        Log::info('SendDailyAppointmentReminders: Starting.', [
            'now' => $now->toDateTimeString(),
            'timezone' => $timezone,
            'target_date' => $targetDate,
            'dry_run' => (bool) $this->option('dry-run'),
        ]);

        if ($this->option('debug')) {
            $this->showDebugInfo($targetDate);
        }

        $consultations = Consultation::whereIn('status', ['accepted', 'rescheduled'])
            ->where('is_published', 1)
            ->whereNotNull('phone')
            ->whereNotNull('consultation_date')
            ->whereDate('consultation_date', $targetDate)
            ->whereNull('sms_reminder_sent_at')
            ->orderBy('consultation_date')
            ->get();

        if ($consultations->isEmpty()) {
            $this->warn('No matching consultations found. Nothing to send.');

            Log::info('SendDailyAppointmentReminders: No matching consultations found.', [
                'target_date' => $targetDate,
            ]);

            return Command::SUCCESS;
        }

        $this->info("Found {$consultations->count()} matching consultation(s).");
        $this->newLine();

        $sent = 0;
        $failed = 0;
        $skipped = 0;

        foreach ($consultations as $consultation) {
            $this->line('--------------------------------------------------');
            $this->line("ID: {$consultation->id}");
            $this->line("Client: {$consultation->first_name} {$consultation->last_name}");
            $this->line("Phone: {$consultation->phone}");
            $this->line("Date: {$consultation->consultation_date}");
            $this->line("Status: {$consultation->status}");

            $message = SmsController::buildAutomatedReminderMessage($consultation);

            if ($this->option('debug') || $this->option('dry-run')) {
                $this->newLine();
                $this->line('SMS preview:');
                $this->line($message);
                $this->newLine();
            }

            if ($this->option('dry-run')) {
                $skipped++;
                $this->warn('Skipped because this is a dry run.');
                continue;
            }

            try {
                $success = SmsController::send($consultation->phone, $message);

                if ($success) {
                    $consultation->update([
                        'sms_reminder_sent_at' => Carbon::now($timezone),
                    ]);

                    $sent++;
                    $this->info('SMS sent successfully.');

                    Log::info('SendDailyAppointmentReminders: SMS sent.', [
                        'consultation_id' => $consultation->id,
                        'phone' => $consultation->phone,
                        'sms_reminder_sent_at' => $consultation->sms_reminder_sent_at,
                    ]);
                } else {
                    $failed++;
                    $this->error('SMS failed to send.');

                    Log::warning('SendDailyAppointmentReminders: SMS failed.', [
                        'consultation_id' => $consultation->id,
                        'phone' => $consultation->phone,
                    ]);
                }
            } catch (\Throwable $e) {
                $failed++;
                $this->error("Exception: {$e->getMessage()}");

                Log::error('SendDailyAppointmentReminders: Exception.', [
                    'consultation_id' => $consultation->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->line('--------------------------------------------------');
        $this->info("Total: {$consultations->count()}");
        $this->info("Sent: {$sent}");
        $this->info("Failed: {$failed}");
        $this->info("Skipped: {$skipped}");

        return Command::SUCCESS;
    }

    private function showDebugInfo(string $targetDate): void
    {
        $this->newLine();
        $this->info('DEBUG: All consultations with dates');
        $this->line('--------------------------------------------------');

        $all = Consultation::whereNotNull('consultation_date')
            ->orderBy('consultation_date')
            ->get();

        if ($all->isEmpty()) {
            $this->warn('No consultations found in database.');
            return;
        }

        $this->table(
            [
                'ID',
                'Name',
                'Phone',
                'Date',
                'Time',
                'Status',
                'Published',
                'Reminder Sent At',
                'Date Match',
                'Eligible Status',
                'Can Send',
            ],
            $all->map(function ($c) use ($targetDate) {
                $date = Carbon::parse($c->consultation_date, 'Asia/Manila');

                $dateMatch = $date->toDateString() === $targetDate;
                $eligibleStatus = in_array(strtolower((string) $c->status), ['accepted', 'rescheduled'], true);
                $canSend =
                    $dateMatch &&
                    $eligibleStatus &&
                    (bool) $c->is_published &&
                    !empty($c->phone) &&
                    empty($c->sms_reminder_sent_at);

                return [
                    $c->id,
                    "{$c->first_name} {$c->last_name}",
                    $c->phone ?? 'NULL',
                    $date->toDateString(),
                    $date->format('H:i:s'),
                    $c->status,
                    $c->is_published ? 'Yes' : 'No',
                    $c->sms_reminder_sent_at
                        ? Carbon::parse($c->sms_reminder_sent_at)->toDateTimeString()
                        : 'NULL',
                    $dateMatch ? 'YES' : 'NO',
                    $eligibleStatus ? 'YES' : 'NO',
                    $canSend ? 'YES' : 'NO',
                ];
            })
        );

        $this->line('--------------------------------------------------');
        $this->newLine();
    }
}