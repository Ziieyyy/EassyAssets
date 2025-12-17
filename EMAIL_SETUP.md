# Email Integration Setup Guide

## Files Created

1. **src/templates/password-reset-email.html** - Beautiful HTML email template
2. **src/services/email.ts** - Email sending service

## Current Status: Development Mode

The system will log emails to the console with a formatted display showing:
- Recipient email
- 4-digit verification code
- Email content preview

## Production Setup (Choose One)

### Option 1: SendGrid

1. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Add to .env:**
   ```env
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

3. **Uncomment in `src/services/email.ts`:**
   ```typescript
   // In sendPasswordResetEmailSendGrid function
   // Remove the /* */ comments
   ```

4. **Update main function:**
   ```typescript
   export const sendPasswordResetEmail = async (email: string, code: string) => {
     await sendPasswordResetEmailSendGrid(email, code);
   };
   ```

### Option 2: Resend

1. **Install Resend:**
   ```bash
   npm install resend
   ```

2. **Add to .env:**
   ```env
   RESEND_API_KEY=your_resend_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

3. **Uncomment in `src/services/email.ts`:**
   ```typescript
   // In sendPasswordResetEmailResend function
   // Remove the /* */ comments
   ```

4. **Update main function:**
   ```typescript
   export const sendPasswordResetEmail = async (email: string, code: string) => {
     await sendPasswordResetEmailResend(email, code);
   };
   ```

## Email Template Features

✅ Responsive design (mobile-friendly)
✅ Purple gradient matching app theme
✅ Large, easy-to-read 4-digit code
✅ 15-minute expiration notice
✅ Security warning
✅ Professional branding
✅ Plain text fallback

## Testing

1. Go to `/forgot-password`
2. Enter your email
3. Click "Send Code"
4. Check browser console for the formatted email output
5. You'll see the 4-digit code displayed

## Template Variables

The HTML template uses these variables (automatically replaced):

- `{{CODE}}` - The 4-digit verification code
- `{{APP_URL}}` - Your application URL

These are replaced in the `generatePasswordResetEmail()` function.

## Customization

Edit `src/templates/password-reset-email.html` to:
- Change colors
- Update branding
- Modify text content
- Add your logo
- Change layout

## Troubleshooting

**Issue: Email not sending**
- Check API keys are correct
- Verify email service account is active
- Check sender email domain is verified
- Look for errors in console

**Issue: Email goes to spam**
- Set up SPF/DKIM records
- Use verified sender domain
- Avoid spam trigger words
- Test with email testing tools
