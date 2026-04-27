<?php
// ============================================================
// FILE 1: app/Mail/BookingConfirmationMail.php
// ============================================================
namespace App\Mail;

use App\Models\Consultation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class BookingRescheduledMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $clientName;
    public string $projectType;
    public string $location;
    public string $consultationDate;
    public string $consultationTime;
    public string $rescheduleReason;
    public string $dashboardUrl;

    public function __construct(Consultation $consultation)
    {
        $dt = $consultation->consultation_date
            ? Carbon::parse($consultation->consultation_date)
            : null;

        $this->clientName       = trim($consultation->first_name . ' ' . $consultation->last_name);
        $this->projectType      = $consultation->project_type ?? 'N/A';
        $this->location         = $consultation->location ?? 'N/A';
        $this->consultationDate = $dt ? $dt->format('F j, Y') : '—';
        $this->consultationTime = $dt ? $dt->format('g:i A')  : '—';
        $this->rescheduleReason = $consultation->reschedule_reason ?? '';
        $this->dashboardUrl     = config('app.url') . '/user/dashboard';
    }

    public function build(): self
    {
        return $this->subject('Your Consultation Has Been Rebooked — RMTY Designs')
                    ->view('emails.booking-rescheduled');
    }
}