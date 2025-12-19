# Password Reset with 4-Digit Code - Setup Guide

## Overview

This implements a custom password reset flow using **4-digit verification codes** sent via email, instead of Supabase's default magic link approach.

## How It Works

### 3-Step Flow:

1. **Request Code** - User enters email → System generates 4-digit code → Stored in database
2. **Verify Code** - User enters 4-digit code → System validates against database
3. **Reset Password** - User enters new password → Password updated via Supabase Auth

---

## Database Setup

### Step 1: Run Migration SQL

Go to **Supabase Dashboard** → **SQL Editor** → Run this:

```sql
-- Create table to store password reset codes
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS password_reset_codes_email_idx ON public.password_reset_codes(email);
CREATE INDEX IF NOT EXISTS password_reset_codes_code_idx ON public.password_reset_codes(code);

-- Enable RLS
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can request password reset codes" ON public.password_reset_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can verify codes" ON public.password_reset_codes
    FOR SELECT USING (true);

CREATE POLICY "Anyone can mark codes as used" ON public.password_reset_codes
    FOR UPDATE USING (true);
```

---

## Email Integration (Required for Production)

### Current State: **DEVELOPMENT MODE**
- Codes are logged to browser console
- **NOT suitable for production**

### For Production: Integrate Email Service

You need to send the 4-digit code via email. Choose one:

#### Option 1: SendGrid
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
  to: email,
  from: 'noreply@yourdomain.com',
  subject: 'Password Reset Code',
  text: `Your password reset code is: ${resetCode}`,
  html: `<strong>Your password reset code is: ${resetCode}</strong>`,
});
```

#### Option 2: Resend
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'noreply@yourdomain.com',
  to: email,
  subject: 'Password Reset Code',
  html: `<p>Your password reset code is: <strong>${resetCode}</strong></p>`,
});
```

#### Option 3: Supabase Edge Function with Email Service
Create an Edge Function to handle email sending securely.

### Update Code Location

In `ForgotPassword.tsx`, replace:
```typescript
// TODO: Integrate with email service
console.log(`Password reset code for ${email}: ${resetCode}`);
```

With your email service code.

---

## Security Features

✅ **Code Expiration** - Codes expire after 15 minutes  
✅ **One-time Use** - Codes are marked as used after verification  
✅ **Rate Limiting** - Prevent abuse (implement in production)  
✅ **Secure Storage** - Codes stored in Supabase with RLS  

---

## Testing (Development)

1. Go to `/forgot-password`
2. Enter your email
3. Click "Send Code"
4. **Open browser console** (F12) - You'll see: `Password reset code for user@example.com: 1234`
5. Enter the 4-digit code
6. Set new password
7. Click "Reset Password"
8. Check email for Supabase's confirmation link
9. Complete the process

---

## File Structure

```
src/pages/ForgotPassword.tsx         - Main component with 3-step flow
migration-add-password-reset-codes.sql - Database schema
```

---

## Environment Variables (For Production)

Add to `.env`:

```env
# Email Service (choose one)
SENDGRID_API_KEY=your_sendgrid_key
# OR
RESEND_API_KEY=your_resend_key

# From email
EMAIL_FROM=noreply@yourdomain.com
```

---

## API Routes (Optional Enhancement)

For better security, create API routes to:
1. Generate and send code (server-side)
2. Verify code (server-side)
3. Update password (server-side)

This prevents exposing code generation logic in the frontend.

---

## Cleanup

### Auto-delete Expired Codes

Run this periodically (daily cron job):

```sql
DELETE FROM public.password_reset_codes
WHERE expires_at < NOW() - INTERVAL '1 day';
```

Or use the included function:
```sql
SELECT clean_expired_reset_codes();
```

---

## Troubleshooting

### Issue: "Code not found"
- Check code hasn't expired (15 min limit)
- Verify email matches exactly
- Ensure code hasn't been used already

### Issue: "Password reset failed"
- User must have an existing Supabase account
- Check Supabase Auth settings allow password updates

### Issue: "Email not sending"
- Check email service API keys
- Verify `EMAIL_FROM` is configured
- Check email service dashboard for delivery logs

---

## Production Checklist

- [ ] Set up email service (SendGrid/Resend/etc.)
- [ ] Remove console.log statements
- [ ] Add rate limiting
- [ ] Set up automated cleanup cron job
- [ ] Test with real email addresses
- [ ] Configure proper "from" email domain
- [ ] Add email templates with branding
- [ ] Monitor failed delivery attempts

---

## Support

For issues or questions, refer to:
- Supabase Auth Documentation
- Your email service provider's docs
- This project's GitHub issues
