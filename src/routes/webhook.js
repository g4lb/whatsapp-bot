const { Router } = require('express');
const { processMessage } = require('../services/pipeline');
const logger = require('../utils/logger').child({ module: 'webhook' });

const router = Router();

// Meta webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('Webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Incoming messages
router.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== 'text') return;

    await processMessage(message);
  } catch (error) {
    logger.error({ err: error }, 'Webhook handler error');
  }
});

module.exports = router;
