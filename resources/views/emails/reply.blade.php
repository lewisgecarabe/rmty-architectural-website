<!DOCTYPE html>
<html>
<body style="margin:0; padding:20px; background:#f4f6f8; font-family: Arial, sans-serif;">

    <div style="max-width:520px; margin:auto; background:#ffffff; padding:28px; border-radius:12px;">

        <!-- Header -->
        <h2 style="margin-top:0; color:#2c3e50;">Reply to Your Inquiry</h2>

        <!-- Message -->
        <div style="margin-top:15px; font-size:14px; color:#2c3e50; line-height:1.6; white-space: pre-line;">
            {!! e($message) !!}
        </div>

        <!-- Divider -->
        <hr style="margin:25px 0; border:none; border-top:1px solid #eee;">

        <p style="font-size:13px; color:#7f8c8d;">
            Best regards,<br>
            <strong>{{ $senderName }}</strong><br>
            RMTY Architectural
        </p>


    </div>

</body>
</html>