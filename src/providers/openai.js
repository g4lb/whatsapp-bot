const OpenAI = require('openai');
const { parseEmailResponse } = require('./parse');
const { EMAIL_PROMPT_PREFIX } = require('../utils/constants');
const logger = require('../utils/logger').child({ module: 'provider:openai' });

let _openai = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

async function generateEmail(requestText) {
  const openai = getOpenAI();

  const prompt = `${EMAIL_PROMPT_PREFIX} ${requestText}`;
  logger.info({ requestText }, 'Generating email via OpenAI');

  await openai.beta.threads.messages.create(process.env.OPENAI_THREAD_ID, {
    role: 'user',
    content: prompt,
  });

  const run = await openai.beta.threads.runs.createAndPoll(process.env.OPENAI_THREAD_ID, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID,
  });

  if (run.status !== 'completed') {
    throw new Error(`Assistant run failed with status: ${run.status}`);
  }

  const messages = await openai.beta.threads.messages.list(process.env.OPENAI_THREAD_ID, {
    order: 'desc',
    limit: 1,
  });

  const responseText = messages.data[0].content[0].text.value;
  const result = parseEmailResponse(responseText);
  logger.info({ subject: result.subject }, 'Email generated via OpenAI');
  return result;
}

module.exports = { generateEmail };
