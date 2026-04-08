const nodemailer = require('nodemailer');
const logger = require('../utils/logger').child({ module: 'mailer' });

let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

function buildMailOptions(subject, body) {
  return {
    from: process.env.GMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    subject,
    text: body,
  };
}

async function sendEmail(subject, body) {
  const mailOptions = buildMailOptions(subject, body);
  logger.info({ to: mailOptions.to, subject }, 'Sending email');
  await getTransporter().sendMail(mailOptions);
  logger.info('Email sent');
}

module.exports = { sendEmail, buildMailOptions };
