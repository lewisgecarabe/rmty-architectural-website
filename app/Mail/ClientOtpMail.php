<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClientOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $clientName;

    public function __construct(string $otp, string $clientName)
    {
        $this->otp = $otp;
        $this->clientName = $clientName;
    }

    public function build(): self
    {
        return $this->subject('Verify Your Email — OTP Code')
                    ->view('emails.client-otp');
    }
}
