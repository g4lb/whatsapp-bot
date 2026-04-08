const { DEFAULT_SUBJECT } = require('../utils/constants');

function parseEmailResponse(responseText) {
  const lines = responseText.split('\n');
  const firstLine = lines[0].trim();

  if (firstLine.toLowerCase().startsWith('subject:')) {
    const subject = firstLine.slice('subject:'.length).trim();
    const body = lines.slice(1).join('\n').trim();
    return { subject, body };
  }

  return { subject: DEFAULT_SUBJECT, body: responseText };
}

module.exports = { parseEmailResponse };
