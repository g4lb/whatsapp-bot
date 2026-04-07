const TRIGGER = 'תכין לי מייל';

function isAllowedSender(phoneNumber) {
  return phoneNumber === process.env.ALLOWED_PHONE_NUMBER;
}

function extractEmailRequest(messageText) {
  if (!messageText || !messageText.startsWith(TRIGGER)) {
    return null;
  }
  const content = messageText.slice(TRIGGER.length).trim();
  return content.length > 0 ? content : null;
}

module.exports = { isAllowedSender, extractEmailRequest };
