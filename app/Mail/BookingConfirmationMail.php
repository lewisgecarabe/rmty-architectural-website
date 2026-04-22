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

    public string $clientName;
    public string $email;
    public string $phone;
    public string $projectType;
    public string $location;
    public string $consultationDate;
    public string $notes;           // ✅ renamed from $message

    public function __construct(Consultation $consultation)
    {
        $this->clientName       = trim($consultation->first_name . ' ' . $consultation->last_name);
        $this->email            = $consultation->email;
        $this->phone            = $consultation->phone ?? '';
        $this->projectType      = $consultation->project_type ?? 'N/A';
        $this->location         = $consultation->location ?? 'N/A';
        $this->consultationDate = $consultation->consultation_date
            ? Carbon::parse($consultation->consultation_date)->format('F j, Y \a\t g:i A')
            : 'To be confirmed';
        $this->notes            = $consultation->message ?? ''; // ✅ renamed
    }

    public function build(): self
    {
        return $this->subject('Booking Received — RMTY Architects')
                    ->view('emails.booking-confirmation');
    }
}