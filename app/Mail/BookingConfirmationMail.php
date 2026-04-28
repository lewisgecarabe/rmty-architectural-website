<?php

namespace App\Mail;

use App\Models\Consultation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class BookingConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $referenceId;        // ← NEW
    public string $clientName;
    public string $email;
    public string $phone;
    public string $projectType;
    public string $location;
    public string $consultationDate;
    public string $consultationTime;
    public string $notes;
    public string $dashboardUrl;

    public function __construct(Consultation $consultation)
    {
        $dt = $consultation->consultation_date
            ? Carbon::parse($consultation->consultation_date)
            : null;

        $this->referenceId      = $consultation->reference_id;             // ← NEW
        $this->clientName       = trim($consultation->first_name . ' ' . $consultation->last_name);
        $this->email            = $consultation->email;
        $this->phone            = $consultation->phone ?? '';
        $this->projectType      = $consultation->project_type ?? 'N/A';
        $this->location         = $consultation->location ?? 'N/A';
        $this->consultationDate = $dt ? $dt->format('F j, Y') : 'To be confirmed';
        $this->consultationTime = $dt ? $dt->format('g:i A')  : 'To be confirmed';
        $this->notes            = $consultation->message ?? '';
        $this->dashboardUrl     = config('app.url') . '/user/dashboard';
    }

    public function build(): self
    {
        return $this->subject("Booking Confirmed [{$this->referenceId}] — RMTY Designs")
                    ->view('emails.booking-confirmation');
    }
}