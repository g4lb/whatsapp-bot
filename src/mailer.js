const nodemailer = require('nodemailer');

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
  await getTransporter().sendMail(mailOptions);
}

module.exports = { sendEmail, buildMailOptions };
