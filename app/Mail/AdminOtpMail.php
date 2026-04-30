<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $clientName; // blade uses $clientName

    public function __construct(string $otp, string $adminName)
    {
        $this->otp        = $otp;
        $this->clientName = $adminName;
    }

    public function build(): self
    {
        return $this->subject('Verify Your Admin Account — OTP Code')
                    ->view('emails.client-otp'); // reuse existing blade
    }
}