<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Password Reset OTP</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7fa;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .email-header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .email-body {
            padding: 40px 30px;
            color: #333333;
        }
        .email-body p {
            line-height: 1.6;
            margin: 0 0 20px;
            font-size: 16px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
        }
        .otp-container {
            background-color: #f8f9fb;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            font-size: 14px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        .otp-code {
            font-size: 42px;
            font-weight: 700;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        .otp-expiry {
            font-size: 14px;
            color: #e53e3e;
            margin-top: 15px;
            font-weight: 500;
        }
        .warning-box {
            background-color: #fff5f5;
            border-left: 4px solid #e53e3e;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .warning-box p {
            margin: 0;
            color: #742a2a;
            font-size: 14px;
        }
        .email-footer {
            background-color: #f8f9fb;
            padding: 30px;
            text-align: center;
            color: #718096;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        .email-footer p {
            margin: 5px 0;
        }
        .security-tip {
            background-color: #ebf8ff;
            border-left: 4px solid #3182ce;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .security-tip p {
            margin: 0;
            color: #2c5282;
            font-size: 14px;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                margin: 20px;
                border-radius: 6px;
            }
            .email-header {
                padding: 30px 20px;
            }
            .email-header h1 {
                font-size: 24px;
            }
            .email-body {
                padding: 30px 20px;
            }
            .otp-code {
                font-size: 36px;
                letter-spacing: 6px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        
        <div class="email-body">
            <p class="greeting">Hello {{ $adminName }},</p>
            
            <p>We received a request to reset your admin dashboard password. Use the One-Time Password (OTP) below to proceed with resetting your password.</p>
            
            <div class="otp-container">
                <div class="otp-label">Your OTP Code</div>
                <div class="otp-code">{{ $otp }}</div>
                <div class="otp-expiry">⏰ Expires in 10 minutes</div>
            </div>
            
            <p>Enter this code on the password reset page along with your new password to complete the process.</p>
            
            <div class="warning-box">
                <p><strong>⚠️ Important:</strong> If you did not request a password reset, please ignore this email and ensure your account is secure. Your password will not be changed unless you complete the reset process.</p>
            </div>
            
            <div class="security-tip">
                <p><strong>🛡️ Security Tips:</strong></p>
                <p>• Never share this OTP with anyone</p>
                <p>• Our team will never ask for your OTP</p>
                <p>• This code can only be used once</p>
            </div>
        </div>
        
        <div class="email-footer">
            <p><strong>{{ config('app.name') }} Admin Dashboard</strong></p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p style="margin-top: 15px; color: #a0aec0; font-size: 12px;">
                © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>