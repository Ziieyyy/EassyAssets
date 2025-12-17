import { supabase } from '@/lib/supabase';

/**
 * Email Service for sending password reset codes
 * Integrate with your preferred email provider (SendGrid, Resend, etc.)
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate email content for password reset
 */
export const generatePasswordResetEmail = (code: string, email: string): EmailTemplate => {
  const appUrl = window.location.origin;
  
  // Read the HTML template
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - myEasyAssets</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%);
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content { padding: 40px 30px; }
        h1 { color: #1f2937; font-size: 24px; margin-bottom: 16px; }
        p { color: #6b7280; font-size: 16px; margin-bottom: 24px; }
        .code-container {
            background: linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%);
            border: 2px solid #e1bee7;
            border-radius: 12px;
            padding: 32px;
            text-align: center;
            margin: 32px 0;
        }
        .code-label {
            color: #764ba2;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
        }
        .code {
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
            margin: 8px 0;
        }
        .info-box {
            background: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 16px 20px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p { color: #9ca3af; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📦 myEasyAssets</div>
            <div>Asset Management System</div>
        </div>
        <div class="content">
            <h1>Password Reset Request</h1>
            <p>Hi there,</p>
            <p>We received a request to reset your password. Use the verification code below to complete the password reset process.</p>
            <div class="code-container">
                <div class="code-label">Your Verification Code</div>
                <div class="code">${code}</div>
                <div style="color: #9333ea; font-size: 13px; margin-top: 12px;">Enter this code in the app to continue</div>
            </div>
            <div class="info-box">
                <p><strong>⏱️ Valid for 15 minutes</strong><br>
                This code will expire 15 minutes from the time it was generated.</p>
            </div>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;"><strong>⚠️ Security Notice</strong><br>
                If you didn't request this password reset, please ignore this email or contact support.</p>
            </div>
        </div>
        <div class="footer">
            <p>© 2024 myEasyAssets. All rights reserved.</p>
            <p style="margin-top: 16px; font-size: 12px;">
                This is an automated message. Please do not reply directly to this email.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();

  // Plain text version
  const textContent = `
myEasyAssets - Password Reset Request

Hi there,

We received a request to reset your password. Use the verification code below to complete the password reset process.

YOUR VERIFICATION CODE: ${code}

⏱️ Valid for 15 minutes
This code will expire 15 minutes from the time it was generated.

⚠️ Security Notice
If you didn't request this password reset, please ignore this email or contact support.

© 2024 myEasyAssets. All rights reserved.
  `.trim();

  return {
    subject: `Your Password Reset Code: ${code}`,
    html: htmlTemplate,
    text: textContent,
  };
};

/**
 * Send password reset email using SendGrid
 * Install: npm install @sendgrid/mail
 */
export const sendPasswordResetEmailSendGrid = async (email: string, code: string) => {
  // Uncomment and configure when ready to use SendGrid
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  const emailContent = generatePasswordResetEmail(code, email);

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@myeasyassets.com',
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  };

  await sgMail.send(msg);
  */
  
  console.log('SendGrid email would be sent to:', email);
  console.log('Code:', code);
};

/**
 * Send password reset email using Resend
 * Install: npm install resend
 */
export const sendPasswordResetEmailResend = async (email: string, code: string) => {
  // Uncomment and configure when ready to use Resend
  /*
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const emailContent = generatePasswordResetEmail(code, email);

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'noreply@myeasyassets.com',
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
  */
  
  console.log('Resend email would be sent to:', email);
  console.log('Code:', code);
};

/**
 * Main function to send password reset email
 * Choose your email provider here
 */
export const sendPasswordResetEmail = async (email: string, code: string) => {
  try {
    // FOR DEVELOPMENT: Just log to console
    console.log('═══════════════════════════════════════');
    console.log('📧 PASSWORD RESET EMAIL');
    console.log('═══════════════════════════════════════');
    console.log('To:', email);
    console.log('Code:', code);
    console.log('═══════════════════════════════════════');
    
    // FOR PRODUCTION: Uncomment one of these
    // await sendPasswordResetEmailSendGrid(email, code);
    // await sendPasswordResetEmailResend(email, code);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};
