import nodemailer from 'nodemailer';

export const sendEmail = async ({email, subject, message}) => {
  try {
    console.log('📧 Attempting to send email with configuration:');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_SERVICE:', process.env.SMTP_SERVICE);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_MAIL:', process.env.SMTP_MAIL);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : '❌ NOT SET');
    console.log('Target email:', email);
    console.log('Subject:', subject);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      service: process.env.SMTP_SERVICE,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration (optional - don't crash if it fails)
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.warn('SMTP verification failed, but continuing anyway:', verifyError.message);
    }

    const options = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: subject,
      html: message,
    };

    const result = await transporter.sendMail(options);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    // Don't re-throw the error to prevent server crashes
    // Return null to indicate failure
    return null;
  }
};
