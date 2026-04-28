<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Booking Confirmed</title>
    <style>
        body  { margin:0; padding:0; background:#f5f5f5; font-family:'Helvetica Neue',Arial,sans-serif; color:#111; }
        .wrap { max-width:560px; margin:40px auto; background:#fff; border:1px solid #e5e5e5; }
        .head { background:#000; padding:36px 40px; }
        .head h1 { margin:0; color:#fff; font-size:22px; font-weight:700; letter-spacing:-.3px; }
        .head p  { margin:6px 0 0; color:#aaa; font-size:12px; letter-spacing:.1em; text-transform:uppercase; }
        .ref  { background:#f9f9f9; border-left:3px solid #000; margin:32px 40px 0; padding:14px 20px; }
        .ref .label { font-size:10px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; color:#888; margin:0 0 4px; }
        .ref .value { font-size:20px; font-weight:800; letter-spacing:.05em; color:#000; margin:0; font-variant-numeric:tabular-nums; }
        .body { padding:32px 40px; }
        .body p  { font-size:15px; line-height:1.6; color:#444; margin:0 0 20px; }
        .table   { width:100%; border-collapse:collapse; margin:24px 0; }
        .table td { padding:11px 0; border-bottom:1px solid #f0f0f0; font-size:13px; vertical-align:top; }
        .table td:first-child { color:#888; font-weight:700; text-transform:uppercase; letter-spacing:.08em; font-size:10px; width:42%; padding-right:12px; }
        .table td:last-child  { color:#111; font-weight:600; }
        .btn  { display:inline-block; margin-top:8px; padding:14px 28px; background:#000; color:#fff;
                text-decoration:none; font-size:11px; font-weight:700; letter-spacing:.15em; text-transform:uppercase; }
        .foot { border-top:1px solid #f0f0f0; padding:24px 40px; font-size:11px; color:#bbb; line-height:1.6; }
    </style>
</head>
<body>
<div class="wrap">

    <!-- Header -->
    <div class="head">
        <h1>Your Session is Confirmed.</h1>
        <p>RMTY Architectural Design</p>
    </div>

    <!-- Reference ID -->
    <div class="ref">
        <p class="label">Your Reference Number</p>
        <p class="value">{{ $referenceId }}</p>
    </div>

    <!-- Body -->
    <div class="body">
        <p>Hi {{ $clientName }},</p>
        <p>
            We've received your consultation request and it has been confirmed.
            Please keep your reference number — you'll need it for any follow-ups,
            rescheduling, or support enquiries.
        </p>

        <table class="table">
            <tr>
                <td>Reference</td>
                <td>{{ $referenceId }}</td>
            </tr>
            <tr>
                <td>Project Type</td>
                <td>{{ $projectType }}</td>
            </tr>
            <tr>
                <td>Location</td>
                <td>{{ $location }}</td>
            </tr>
            <tr>
                <td>Date</td>
                <td>{{ $consultationDate }}</td>
            </tr>
            <tr>
                <td>Time</td>
                <td>{{ $consultationTime }}</td>
            </tr>
            @if($phone)
            <tr>
                <td>Contact</td>
                <td>{{ $phone }}</td>
            </tr>
            @endif
            @if($notes)
            <tr>
                <td>Notes</td>
                <td>{{ $notes }}</td>
            </tr>
            @endif
        </table>

        <p>
            You can track the status of your consultation anytime through your
            client dashboard.
        </p>

        <a href="{{ $dashboardUrl }}" class="btn">View Dashboard</a>
    </div>

    <!-- Footer -->
    <div class="foot">
        <p>
            Questions? Reply to this email or contact us at
            <a href="mailto:hello@rmty.com" style="color:#111;">hello@rmty.com</a>
            and quote your reference number <strong>{{ $referenceId }}</strong>.
        </p>
        <p style="margin-top:10px;color:#ccc;">
            © {{ date('Y') }} RMTY Architectural Design. All rights reserved.
        </p>
    </div>

</div>
</body>
</html>