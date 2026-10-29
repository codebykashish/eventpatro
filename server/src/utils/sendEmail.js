const nodemailer = require('nodemailer')

// Sends OTP verification email or logs to console during development
const sendEmail = async ({ to, subject, text, html, otp }) => {
  // If SMTP environment variables are configured, send real email
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    return transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Eventpatro'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    })
  }

  // Development fallback: Log OTP clearly in terminal for instant testing
  console.log('\n' + '='.repeat(54))
  console.log(' [EVENTPATRO EMAIL VERIFICATION OTP]')
  console.log(` Recipient: ${to}`)
  console.log(` Code:      ${otp}`)
  console.log(' Valid for: 10 minutes')
  console.log('='.repeat(54) + '\n')

  return true
}

module.exports = sendEmail
