const translate = require('google-translate-api-x');
const logger = require('../utils/logger').child({ module: 'translator' });

async function translateToEnglish(hebrewText) {
  logger.info({ hebrewText }, 'Translating Hebrew to English');
  const result = await translate(hebrewText, { from: 'he', to: 'en' });
  logger.info({ translatedText: result.text }, 'Translation complete');
  return result.text;
}

module.exports = { translateToEnglish };
