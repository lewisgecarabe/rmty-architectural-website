<!DOCTYPE html>
<html>
<body style="margin:0; padding:20px; background:#f4f6f8; font-family: Arial, sans-serif;">

    <div style="max-width:520px; margin:auto; background:#ffffff; padding:28px; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.06);">

    <span style="display:none;">
    New inquiry from {{ $inquiry->name }}
</span>

        <!-- Header -->
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="margin:0; color:#2c3e50;">📩 New Inquiry</h2>
            <p style="margin:6px 0 0; color:#7f8c8d; font-size:13px;">
                Submitted via {{ strtoupper($inquiry->platform) }}
            </p>
        </div>

        <!-- Divider -->
        <hr style="border:none; border-top:1px solid #ecf0f1; margin:20px 0;">

        <!-- Info -->
        <div style="font-size:14px; color:#34495e; line-height:1.6;">
            <p><strong>👤 Name:</strong> {{ $inquiry->name }}</p>
            <p><strong>📧 Email:</strong> {{ $inquiry->email }}</p>

            @if($inquiry->phone)
                <p><strong>📱 Phone:</strong> {{ $inquiry->phone }}</p>
            @endif

            <p><strong>🕒 Received:</strong> {{ $inquiry->created_at->format('M d, Y h:i A') }}</p>
        </div>

        <!-- Message -->
        <div style="margin-top:20px;">
            <p style="margin-bottom:8px; font-weight:bold; color:#2c3e50;">Message:</p>

            <div style="background:#f9fafb; padding:15px; border-radius:8px; font-size:14px; color:#2c3e50; white-space:pre-line;">
                {{ $inquiry->message }}
            </div>
        </div>

        <!-- Button -->
        <div style="text-align:center; margin-top:25px;">
            <a href=https://your-ngrok-url.ngrok-free.dev/inquiries
               style="background:#3498db; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:6px; font-size:14px; font-weight:bold;">
                View in Dashboard
            </a>
        </div>

        <!-- Footer -->
        <div style="text-align:center; font-size:12px; color:#95a5a6; margin-top:25px;">
            <p style="margin:0;">RMTY Architectural</p>
            <p style="margin:5px 0 0;">Automated system email</p>
        </div>

    </div>

</body>
</html>