<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultation Rebooked</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 40px 20px; -webkit-font-smoothing: antialiased;">

    <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">

        {{-- Header --}}
        <div style="background-color: #000000; padding: 40px; text-align: center;">
            <h2 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 900; letter-spacing: -0.05em; color: #ffffff; text-transform: uppercase;">RMTY</h2>
            <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.25em; color: #737373; text-transform: uppercase;">Designs Studio </p>
        </div>

        {{-- Status Banner --}}
        <div style="background-color: #eff6ff; border-bottom: 1px solid #bfdbfe; padding: 18px 40px;">
            <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #1d4ed8; text-transform: uppercase;">
                &#8635; &nbsp; Consultation Successfully Rebooked
            </p>
        </div>

        {{-- Body --}}
        <div style="padding: 40px;">

            <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; color: #a3a3a3; text-transform: uppercase;">Hello,</p>
            <p style="margin: 0 0 20px 0; font-size: 22px; font-weight: 800; color: #000000; letter-spacing: -0.03em;">{{ $clientName }}.</p>

            <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.7; color: #525252;">
                Your architecture consultation with <strong>RMTY Designs</strong> has been successfully rebooked. We look forward to meeting with you and discussing your project at the new time.
            </p>

            {{-- Updated appointment details --}}
            <div style="border: 1px solid #e5e5e5; border-radius: 16px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #000000; padding: 16px 24px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.2em; color: #737373; text-transform: uppercase;">Updated Appointment Details</p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 0 24px;">
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase; width: 40%;">Client</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $clientName }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">New Date</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $consultationDate }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">New Time</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $consultationTime }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Location</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $location }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Project Type</td>
                        <td style="padding: 16px 0; border-bottom: 1px solid #f5f5f5; font-size: 13px; font-weight: 600; color: #171717; text-align: right;">{{ $projectType }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 16px 0; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #a3a3a3; text-transform: uppercase;">Status</td>
                        <td style="padding: 16px 0; text-align: right;">
                            <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #1d4ed8; text-transform: uppercase; background-color: #eff6ff; padding: 4px 12px; border-radius: 99px; border: 1px solid #bfdbfe;">Rebooked</span>
                        </td>
                    </tr>
                </table>
            </div>

            @if(!empty($rescheduleReason))
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px 24px; margin-bottom: 30px;">
                <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #1d4ed8; text-transform: uppercase;">Reason for Rescheduling</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e3a8a;">{{ $rescheduleReason }}</p>
            </div>
            @endif

            {{-- Manage Booking CTA --}}
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="{{ $dashboardUrl }}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">
                    Manage My Booking
                </a>
            </div>

            <div style="background-color: #f8fafc; border-left: 3px solid #3b82f6; padding: 16px 20px 16px 24px; border-radius: 0 8px 8px 0; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #1e3a8a;">
                    If you need to make further changes, use the button above
                </p>
            </div>

           
        </div>

        <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e5e5;">


        {{-- Footer --}}
        <div style="background-color: #fafafa; border-top: 1px solid #f5f5f5; padding: 30px 40px; text-align: center;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #525252;">Warm regards, RMTY Designs Studio</p>
            <p style="font-size: 12px; color: #777; line-height: 1.6;">
    📞 (+63) 915 896 2275<br>
    📍 911 Josefina 2 Sampaloc, Manila, Philippines, 1008
</p>
        </div>

    </div>
</body>
</html>
