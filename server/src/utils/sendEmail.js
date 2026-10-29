const nodemailer = require('nodemailer')

// Sends real OTP email via configured SMTP (e.g. Gmail) or Ethereal test mailbox
const sendEmail = async ({ to, subject, text, html, otp }) => {
  // 1. If real SMTP credentials are provided in .env, send the real email!
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || (process.env.SMTP_HOST ? undefined : 'gmail'),
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      const info = await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Eventpatro'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      })

      console.log(`[EMAIL SENT] Real email delivered to ${to}. MessageId: ${info.messageId}`)
      return info
    } catch (err) {
      console.error('[EMAIL ERROR] Failed to send via SMTP:', err.message)
      // Fall through to console fallback if SMTP fails
    }
  }

  // 2. Terminal log & fallback
  console.log('\n' + '='.repeat(56))
  console.log(' [EVENTPATRO EMAIL VERIFICATION OTP]')
  console.log(` Recipient: ${to}`)
  console.log(` 6-Digit Code: ${otp}`)
  console.log(' Valid for: 10 minutes')
  console.log(' Note: To deliver to real inbox, set SMTP_USER and SMTP_PASS in server/.env')
  console.log('='.repeat(56) + '\n')

  return true
}

module.exports = sendEmail
