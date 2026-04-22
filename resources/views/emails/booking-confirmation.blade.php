<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultation Booking Confirmed</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 40px 20px; -webkit-font-smoothing: antialiased;">

    <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02);">

        {{-- Header --}}
        <div style="background-color: #000000; padding: 40px; text-align: center;">
            <h2 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 900; letter-spacing: -0.05em; color: #ffffff; text-transform: uppercase;">RMTY</h2>
            <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; color: #737373; text-transform: uppercase;">Architects // Est. 1994</p>
        </div>

        {{-- Status Banner --}}
        <div style="background-color: #f5f5f5; border-bottom: 1px solid #e5e5e5; padding: 20px 40px;">
            <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #525252; text-transform: uppercase;">
                &#9679; &nbsp; Consultation Request Received — Pending Confirmation
            </p>
        </div>

        {{-- Body --}}
        <div style="padding: 40px;">

            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #a3a3a3; text-transform: uppercase;">Hello,</p>
            <p style="margin: 0 0 24px 0; font-size: 22px; font-weight: 800; color: #000000; letter-spacing: -0.03em;">{{ $clientName }}.</p>

            <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.7; color: #525252;">
                We've received your consultation request. Our team will review the details and reach out shortly to formally confirm your schedule. Here's a summary of your booking.
            </p>

            {{-- Booking Summary Card --}}
            <div style="border: 1px solid #e5e5e5; border-radius: 16px; overflow: hidden; margin-bottom: 30px;">

                <div style="background-color: #000000; padding: 16px 24px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #737373; text-transform: uppercase;">Booking Summary</p>
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 0 24px;">
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; width: 40%;">Client</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $clientName }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Email</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $email }}</td>
                    </tr>
                    @if(!empty($phone))
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Phone</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $phone }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Project Type</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $projectType }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Location</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $location }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Requested Date</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $consultationDate }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Status</td>
                        <td style="padding: 16px 0; text-align: right;">
                            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #d97706; text-transform: uppercase; background-color: #fffbeb; padding: 4px 12px; border-radius: 99px; border: 1px solid #fde68a;">Pending</span>
                        </td>
                    </tr>
                </table>
            </div>

            {{-- Notes - only shown if provided. Uses $notes NOT $message ($message is reserved by Laravel) --}}
            @if(!empty($notes))
            <div style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px 24px; margin-bottom: 30px;">
                <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #a3a3a3; text-transform: uppercase;">Your Notes</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #525252; font-style: italic;">"{{ $notes }}"</p>
            </div>
            @endif

            {{-- What's Next --}}
            <div style="background-color: #f8fafc; border-left: 3px solid #3b82f6; padding: 20px 20px 20px 24px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
                <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.1em;">What Happens Next</p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 2; color: #1e3a8a;">
                    <li>Our team will review your submission within 1–2 business days.</li>
                    <li>You'll receive a follow-up email or call to confirm the date.</li>
                    <li>A final confirmation email will be sent once approved.</li>
                </ul>
            </div>

            {{-- Security Notice --}}
            <div style="background-color: #fff1f2; border-left: 3px solid #e11d48; padding: 16px 20px 16px 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #9f1239;">
                    <strong>Didn't request this?</strong> If you did not submit this consultation form, please contact us immediately at
                    <a href="mailto:{{ config('mail.from.address') }}" style="color: #9f1239;">{{ config('mail.from.address') }}</a>.
                </p>
            </div>

        </div>

        {{-- Footer --}}
        <div style="background-color: #fafafa; border-top: 1px solid #f5f5f5; padding: 30px 40px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 700; color: #525252;">{{ config('app.name') }} // Client Portal</p>
            <p style="margin: 0 0 15px 0; font-size: 11px; color: #737373;">This is an automated message — please do not reply directly.</p>
            <p style="margin: 0; font-size: 10px; color: #a3a3a3; font-weight: 500;">&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>

    </div>
</body>
</html>