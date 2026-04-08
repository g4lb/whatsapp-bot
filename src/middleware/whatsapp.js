const { TRIGGER_PHRASE } = require('../utils/constants');

function isAllowedSender(phoneNumber) {
  return phoneNumber === process.env.ALLOWED_PHONE_NUMBER;
}

function extractEmailRequest(messageText) {
  if (!messageText || !messageText.startsWith(TRIGGER_PHRASE)) {
    return null;
  }
  const content = messageText.slice(TRIGGER_PHRASE.length).trim();
  return content.length > 0 ? content : null;
}

module.exports = { isAllowedSender, extractEmailRequest };
