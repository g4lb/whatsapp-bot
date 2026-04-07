const translate = require('google-translate-api-x');

async function translateToEnglish(hebrewText) {
  const result = await translate(hebrewText, { from: 'he', to: 'en' });
  return result.text;
}

module.exports = { translateToEnglish };
