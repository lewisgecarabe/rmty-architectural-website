<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultation Cancelled</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 40px 20px; -webkit-font-smoothing: antialiased;">

    <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">

        {{-- Header --}}
        <div style="background-color: #000000; padding: 40px; text-align: center;">
            <h2 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 900; letter-spacing: -0.05em; color: #ffffff; text-transform: uppercase;">RMTY</h2>
            <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; color: #737373; text-transform: uppercase;">Designs Studio</p>
        </div>

        {{-- Status Banner --}}
        <div style="background-color: #fff1f2; border-bottom: 1px solid #fecdd3; padding: 18px 40px;">
            <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #be123c; text-transform: uppercase;">
                &#10007; &nbsp; Consultation Cancelled
            </p>
        </div>

        {{-- Body --}}
        <div style="padding: 40px;">

            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #a3a3a3; text-transform: uppercase;">Hello,</p>
            <p style="margin: 0 0 20px 0; font-size: 22px; font-weight: 800; color: #000000; letter-spacing: -0.03em;">{{ $clientName }}.</p>

            <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.7; color: #525252;">
                Your scheduled consultation with <strong>RMTY Designs</strong> has been successfully cancelled. We're sorry to see it go — we'd be happy to work with you when you're ready.
            </p>

            {{-- Cancelled appointment summary --}}
            <div style="border: 1px solid #e5e5e5; border-radius: 16px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #000000; padding: 16px 24px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #737373; text-transform: uppercase;">Cancelled Appointment</p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 0 24px;">
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; width: 40%;">Date</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $consultationDate }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Time</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $consultationTime }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Project Type</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $projectType }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Status</td>
                        <td style="padding: 16px 0; text-align: right;">
                            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #be123c; text-transform: uppercase; background-color: #fff1f2; padding: 4px 12px; border-radius: 99px; border: 1px solid #fecdd3;">Cancelled</span>
                        </td>
                    </tr>
                </table>
            </div>

            @if(!empty($cancelReason))
            <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px 24px; margin-bottom: 30px;">
                <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #be123c; text-transform: uppercase;">Reason for Cancellation</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #9f1239;">{{ $cancelReason }}</p>
            </div>
            @endif

            {{-- Book Again CTA --}}
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="{{ $bookingUrl }}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">
                    Book Another Session
                </a>
            </div>

            <div style="background-color: #f8fafc; border-left: 3px solid #3b82f6; padding: 16px 20px 16px 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #1e3a8a;">
                    If you have questions or would like to reschedule, feel free to reach out at button above     </p>
            </div>
        </div>
<hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e5e5;">


        {{-- Footer --}}
        <div style="background-color: #fafafa; border-top: 1px solid #f5f5f5; padding: 30px 40px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #525252;">Best regards, RMTY Designs Studio</p>
                <p style="font-size: 12px; color: #777; line-height: 1.6;">
    📞 (+63) 915 896 2275<br>
    📍 911 Josefina 2 Sampaloc, Manila, Philippines, 1008
</p>
        </div>


    </div>
</body>
</html>