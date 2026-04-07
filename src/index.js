require('dotenv').config();
const express = require('express');
const { isAllowedSender, extractEmailRequest } = require('./whatsapp');
const { translateToEnglish } = require('./translator');
const { generateEmail } = require('./providers').getProvider();
const { sendEmail } = require('./mailer');

const app = express();
app.use(express.json());

// Meta webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Incoming messages
app.post('/webhook', async (req, res) => {
  // Respond immediately to Meta (they require 200 within 20s)
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== 'text') return;

    const senderPhone = message.from;
    const messageText = message.text?.body;

    if (!isAllowedSender(senderPhone)) return;

    const emailContent = extractEmailRequest(messageText);
    if (!emailContent) return;

    console.log('Processing email request:', emailContent);

    const translatedText = await translateToEnglish(emailContent);
    console.log('Translated:', translatedText);

    const { subject, body } = await generateEmail(translatedText);
    console.log('Generated email - Subject:', subject);

    await sendEmail(subject, body);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error processing message:', error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
