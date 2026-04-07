# WhatsApp Email Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js bot that receives WhatsApp messages with a Hebrew trigger phrase, translates them, generates a professional email via OpenAI Assistants API, and sends it via Gmail.

**Architecture:** Express webhook server receives Meta WhatsApp Cloud API messages, validates sender and trigger, translates Hebrew→English, sends to a persistent OpenAI Assistant thread for email generation, then sends the result via Gmail SMTP using Nodemailer.

**Tech Stack:** Node.js, Express, OpenAI SDK (Assistants API), google-translate-api-x, Nodemailer, dotenv

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | Dependencies and scripts |
| `.env.example` | Template for environment variables |
| `.gitignore` | Ignore node_modules, .env |
| `src/index.js` | Express server, webhook endpoints, orchestration |
| `src/whatsapp.js` | Sender validation, trigger detection, message extraction |
| `src/translator.js` | Hebrew → English translation |
| `src/assistant.js` | OpenAI Assistants API: add message to thread, run, parse response |
| `src/mailer.js` | Send email via Gmail SMTP |
| `tests/whatsapp.test.js` | Tests for message validation and trigger extraction |
| `tests/translator.test.js` | Tests for translation module |
| `tests/assistant.test.js` | Tests for response parsing |
| `tests/mailer.test.js` | Tests for email construction |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Initialize the project**

```bash
cd /Users/galb/Documents/whatsapp-bot
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install express openai google-translate-api-x nodemailer dotenv
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev jest
```

- [ ] **Step 4: Update package.json scripts**

Add to `package.json`:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "test": "jest"
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
.env
```

- [ ] **Step 6: Create .env.example**

```
PORT=3000
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token_here
ALLOWED_PHONE_NUMBER=972501234567
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ASSISTANT_ID=asst_your_assistant_id
OPENAI_THREAD_ID=thread_your_thread_id
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your_app_password
RECIPIENT_EMAIL=recipient@example.com
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example
git commit -m "chore: initialize project with dependencies"
```

---

### Task 2: WhatsApp Message Handler

**Files:**
- Create: `src/whatsapp.js`
- Create: `tests/whatsapp.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/whatsapp.test.js`:

```javascript
const { isAllowedSender, extractEmailRequest } = require('../src/whatsapp');

describe('isAllowedSender', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ALLOWED_PHONE_NUMBER: '972501234567' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns true for allowed phone number', () => {
    expect(isAllowedSender('972501234567')).toBe(true);
  });

  test('returns false for different phone number', () => {
    expect(isAllowedSender('972509999999')).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isAllowedSender(undefined)).toBe(false);
  });
});

describe('extractEmailRequest', () => {
  test('extracts text after trigger phrase', () => {
    expect(extractEmailRequest('תכין לי מייל על הפגישה של מחר')).toBe('על הפגישה של מחר');
  });

  test('extracts text with extra spaces after trigger', () => {
    expect(extractEmailRequest('תכין לי מייל  על הפגישה')).toBe('על הפגישה');
  });

  test('returns null when message does not start with trigger', () => {
    expect(extractEmailRequest('שלום מה שלומך')).toBeNull();
  });

  test('returns null for empty content after trigger', () => {
    expect(extractEmailRequest('תכין לי מייל')).toBeNull();
  });

  test('returns null for trigger with only spaces after', () => {
    expect(extractEmailRequest('תכין לי מייל   ')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/whatsapp.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/whatsapp'`

- [ ] **Step 3: Write the implementation**

Create `src/whatsapp.js`:

```javascript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/whatsapp.test.js --verbose
```

Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/whatsapp.js tests/whatsapp.test.js
git commit -m "feat: add WhatsApp message validation and trigger detection"
```

---

### Task 3: Translator Module

**Files:**
- Create: `src/translator.js`
- Create: `tests/translator.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/translator.test.js`:

```javascript
const { translateToEnglish } = require('../src/translator');

describe('translateToEnglish', () => {
  test('translates Hebrew text to English', async () => {
    const result = await translateToEnglish('שלום');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns a string for longer Hebrew text', async () => {
    const result = await translateToEnglish('על הפגישה של מחר בנושא התקציב');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
}, 15000);
```

Note: These are integration tests that hit the translation service. The 15s timeout accounts for network latency.

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/translator.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/translator'`

- [ ] **Step 3: Write the implementation**

Create `src/translator.js`:

```javascript
const translate = require('google-translate-api-x');

async function translateToEnglish(hebrewText) {
  const result = await translate(hebrewText, { from: 'he', to: 'en' });
  return result.text;
}

module.exports = { translateToEnglish };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/translator.test.js --verbose
```

Expected: All 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/translator.js tests/translator.test.js
git commit -m "feat: add Hebrew to English translation module"
```

---

### Task 4: OpenAI Assistant Module

**Files:**
- Create: `src/assistant.js`
- Create: `tests/assistant.test.js`

- [ ] **Step 1: Write the failing test for response parsing**

Create `tests/assistant.test.js`:

```javascript
const { parseEmailResponse } = require('../src/assistant');

describe('parseEmailResponse', () => {
  test('parses response with Subject: prefix', () => {
    const response = 'Subject: Meeting Tomorrow\n\nDear Team,\n\nI am writing to confirm our meeting.\n\nBest regards';
    const result = parseEmailResponse(response);
    expect(result.subject).toBe('Meeting Tomorrow');
    expect(result.body).toBe('Dear Team,\n\nI am writing to confirm our meeting.\n\nBest regards');
  });

  test('handles response without Subject: prefix', () => {
    const response = 'Dear Team,\n\nI am writing to confirm our meeting.\n\nBest regards';
    const result = parseEmailResponse(response);
    expect(result.subject).toBe('Email Request');
    expect(result.body).toBe(response);
  });

  test('handles Subject: with extra whitespace', () => {
    const response = 'Subject:   Budget Review  \n\nPlease review the budget.';
    const result = parseEmailResponse(response);
    expect(result.subject).toBe('Budget Review');
    expect(result.body).toBe('Please review the budget.');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/assistant.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/assistant'`

- [ ] **Step 3: Write the implementation**

Create `src/assistant.js`:

```javascript
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseEmailResponse(responseText) {
  const lines = responseText.split('\n');
  const firstLine = lines[0].trim();

  if (firstLine.toLowerCase().startsWith('subject:')) {
    const subject = firstLine.slice('subject:'.length).trim();
    const body = lines.slice(1).join('\n').trim();
    return { subject, body };
  }

  return { subject: 'Email Request', body: responseText };
}

async function generateEmail(requestText) {
  await openai.beta.threads.messages.create(process.env.OPENAI_THREAD_ID, {
    role: 'user',
    content: `Write a professional email about: ${requestText}`,
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
  return parseEmailResponse(responseText);
}

module.exports = { generateEmail, parseEmailResponse };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/assistant.test.js --verbose
```

Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/assistant.js tests/assistant.test.js
git commit -m "feat: add OpenAI Assistants API email generation module"
```

---

### Task 5: Mailer Module

**Files:**
- Create: `src/mailer.js`
- Create: `tests/mailer.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/mailer.test.js`:

```javascript
const { buildMailOptions } = require('../src/mailer');

describe('buildMailOptions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GMAIL_USER: 'sender@gmail.com',
      RECIPIENT_EMAIL: 'recipient@example.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('builds correct mail options', () => {
    const options = buildMailOptions('Test Subject', 'Hello there');
    expect(options).toEqual({
      from: 'sender@gmail.com',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Hello there',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/mailer.test.js --verbose
```

Expected: FAIL — `Cannot find module '../src/mailer'`

- [ ] **Step 3: Write the implementation**

Create `src/mailer.js`:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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
  await transporter.sendMail(mailOptions);
}

module.exports = { sendEmail, buildMailOptions };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/mailer.test.js --verbose
```

Expected: All 1 test PASS

- [ ] **Step 5: Commit**

```bash
git add src/mailer.js tests/mailer.test.js
git commit -m "feat: add Gmail email sending module"
```

---

### Task 6: Express Server + Webhook Endpoints

**Files:**
- Create: `src/index.js`

- [ ] **Step 1: Write the server**

Create `src/index.js`:

```javascript
require('dotenv').config();
const express = require('express');
const { isAllowedSender, extractEmailRequest } = require('./whatsapp');
const { translateToEnglish } = require('./translator');
const { generateEmail } = require('./assistant');
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
```

- [ ] **Step 2: Verify the server starts**

Create a `.env` file with placeholder values for local testing:
```bash
cp .env.example .env
```

Then start:
```bash
node src/index.js
```

Expected: `Server running on port 3000` — then Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add src/index.js
git commit -m "feat: add Express server with webhook endpoints"
```

---

### Task 7: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

````markdown
# WhatsApp Email Bot

Receives WhatsApp messages with a Hebrew trigger phrase, translates them to English, generates a professional email using OpenAI's Assistants API, and sends it via Gmail.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

- **WHATSAPP_VERIFY_TOKEN**: Any string you choose (used during webhook setup)
- **WHATSAPP_ACCESS_TOKEN**: From Meta Developer Console
- **ALLOWED_PHONE_NUMBER**: Phone number in international format without `+` (e.g. `972501234567`)
- **OPENAI_API_KEY**: Your OpenAI API key
- **OPENAI_ASSISTANT_ID**: Create an assistant at platform.openai.com with instructions: *"You are an email writer. When given a topic, write a professional email. Always include a clear subject line on the first line prefixed with 'Subject: ', followed by a blank line, then the email body."*
- **OPENAI_THREAD_ID**: Create a thread via the OpenAI API or dashboard
- **GMAIL_USER**: Your Gmail address
- **GMAIL_APP_PASSWORD**: Gmail App Password (enable 2FA first, then generate at myaccount.google.com → Security → App Passwords)
- **RECIPIENT_EMAIL**: The email address that receives all generated emails

### 3. Start the server

```bash
npm start
```

### 4. Set up Meta webhook

1. Go to developers.facebook.com → your app → WhatsApp → Configuration
2. Set webhook URL to `https://your-server.com/webhook`
3. Set verify token to your `WHATSAPP_VERIFY_TOKEN` value
4. Subscribe to `messages` events

## Usage

Send a WhatsApp message starting with **תכין לי מייל** followed by the email topic in Hebrew. The bot will translate it, generate a professional email, and send it to the configured recipient.

Example: `תכין לי מייל על הפגישה של מחר בנושא התקציב`

## Tests

```bash
npm test
```
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```
