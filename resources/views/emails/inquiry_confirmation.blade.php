<!DOCTYPE html>
<html>
<body style="margin:0; padding:20px; background:#f4f6f8; font-family: Arial, sans-serif;">

    <div style="max-width:520px; margin:auto; background:#ffffff; padding:28px; border-radius:12px;">

        <h2 style="margin-top:0; color:#2c3e50;">We received your inquiry</h2>

        <p style="font-size:14px; color:#2c3e50; line-height:1.6;">
            Hi {{ $name }},<br><br>
            Thank you for reaching out to <strong>RMTY Architectural</strong>. We have received your message and will get back to you as soon as possible.
        </p>

        <div style="margin-top:15px; background:#f8f9fa; border-left:4px solid #2c3e50; padding:14px 18px; border-radius:4px; font-size:13px; color:#555; line-height:1.6; white-space:pre-line;">{{ $userMessage }}</div>

        <hr style="margin:25px 0; border:none; border-top:1px solid #eee;">

        <p style="font-size:13px; color:#7f8c8d;">
            Best regards,<br>
            <strong>RMTY Architectural</strong>
        </p>

    </div>

</body>
</html>
