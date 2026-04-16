<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Password Reset OTP</title>
    </head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 40px 20px; -webkit-font-smoothing: antialiased;">

    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);">
        
        <div style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #f5f5f5;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.05em; color: #000000; text-transform: uppercase;">
                RMTY
            </h2>
            <p style="margin: 10px 0 0 0; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #a3a3a3; text-transform: uppercase;">
                Password Reset Request
            </p>
        </div>
        
        <div style="padding: 40px;">
            <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #171717;">
                Hello {{ $adminName }},
            </p>
            
            <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #525252;">
                We received a request to reset your admin dashboard password. Use the One-Time Password (OTP) below to proceed.
            </p>
            
            <div style="background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #737373; text-transform: uppercase;">
                    Your OTP Code
                </p>
                <div style="font-size: 40px; font-weight: 900; color: #000000; letter-spacing: 0.25em; margin-bottom: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                    {{ $otp }}
                </div>
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #dc2626;">
                    Expires in 10 minutes
                </p>
            </div>
            
            <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #525252;">
                Enter this code on the password reset page along with your new password to complete the process.
            </p>
            
            <div style="background-color: #fff1f2; border-left: 3px solid #e11d48; padding: 16px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #9f1239; margin-bottom: 4px;">
                    Important Notice
                </p>
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9f1239;">
                    If you did not request a password reset, please ignore this email. Your account is secure.
                </p>
            </div>
            
            <div style="background-color: #f8fafc; border-left: 3px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #1e3a8a; margin-bottom: 8px;">
                    Security Tips
                </p>
                <ul style="margin: 0; padding-left: 16px; font-size: 13px; line-height: 1.6; color: #1e3a8a;">
                    <li>Never share this OTP with anyone.</li>
                    <li>Our team will never ask for your OTP.</li>
                </ul>
            </div>
        </div>
        
        <div style="background-color: #fafafa; border-top: 1px solid #f5f5f5; padding: 30px 40px; text-align: center;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 700; color: #525252;">
                {{ config('app.name') }} Admin Dashboard
            </p>
            <p style="margin: 0 0 15px 0; font-size: 11px; color: #737373;">
                This is an automated message, please do not reply.
            </p>
            <p style="margin: 0; font-size: 10px; color: #a3a3a3; font-weight: 500;">
                &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
        </div>
        
    </div>
</body>
</html>