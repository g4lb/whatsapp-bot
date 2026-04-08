const { isAllowedSender, extractEmailRequest } = require('../middleware/whatsapp');
const { translateToEnglish } = require('./translator');
const { getProvider } = require('../providers');
const { sendEmail } = require('./mailer');
const logger = require('../utils/logger').child({ module: 'pipeline' });

async function processMessage(message) {
  try {
    const senderPhone = message.from;
    const messageText = message.text?.body;

    if (!isAllowedSender(senderPhone)) return;

    const emailContent = extractEmailRequest(messageText);
    if (!emailContent) return;

    logger.info({ emailContent }, 'Processing email request');

    const translatedText = await translateToEnglish(emailContent);
    logger.info({ translatedText }, 'Translation complete');

    const { generateEmail } = getProvider();
    const { subject, body } = await generateEmail(translatedText);
    logger.info({ subject }, 'Email generated');

    await sendEmail(subject, body);
    logger.info('Email sent');
  } catch (error) {
    logger.error({ err: error }, 'Failed to process message');
  }
}

module.exports = { processMessage };
