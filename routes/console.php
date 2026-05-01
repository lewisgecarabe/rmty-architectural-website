<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\SendDailyAppointmentReminders;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Daily Automated Appointment Reminder
|--------------------------------------------------------------------------
| Sends SMS every 7:00 AM Philippine time for today's accepted/rescheduled
| consultations that have not yet received an SMS reminder.
*/
Schedule::command(SendDailyAppointmentReminders::class)
    ->dailyAt('07:00')
    ->timezone('Asia/Manila')
    ->withoutOverlapping();

// Schedule::command(SendDailyAppointmentReminders::class)
//     ->dailyAt('17:00')
//     ->timezone('Asia/Manila')
//     ->withoutOverlapping();