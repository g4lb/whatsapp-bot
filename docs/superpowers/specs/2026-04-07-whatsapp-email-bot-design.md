# WhatsApp Email Bot — Design Spec

## Overview

A Node.js bot that receives WhatsApp messages, detects a Hebrew trigger phrase, translates the content to English, generates a professional email using OpenAI's Assistants API, and sends it via Gmail.

## Flow

1. A WhatsApp message arrives via Meta Cloud API webhook
2. The bot validates the sender is the allowed phone number
3. The bot checks the message starts with "תכין לי מייל"
4. The trigger phrase is stripped; the remaining text is the email request
5. The Hebrew text is translated to English using `google-translate-api-x`
6. The translated text is sent to an OpenAI Assistant on a persistent thread: "Write a professional email about: {translated text}"
7. The assistant's response (subject + body) is sent as an email via Gmail SMTP
8. No reply is sent back on WhatsApp

## Architecture

```
WhatsApp User (specific number)
        |
        v
Meta Cloud API --webhook--> Node.js/Express Server
                                    |
                                    v
                           1. Validate sender number
                           2. Check trigger phrase "תכין לי מייל"
                           3. Extract body text after trigger
                           4. Translate Hebrew -> English
                           5. Send to OpenAI Assistants API (persistent thread)
                           6. Send generated email via Gmail
```

## Project Structure

```
whatsapp-bot/
├── src/
│   ├── index.js          — Express server + webhook endpoints
│   ├── whatsapp.js       — Message validation + trigger detection
│   ├── translator.js     — Hebrew -> English translation
│   ├── assistant.js      — OpenAI Assistants API interaction
│   └── mailer.js         — Gmail sending via Nodemailer
├── .env                  — Environment variables
├── .env.example          — Template for env vars
├── package.json
└── README.md
```

## Modules

### index.js — Express Server

- `GET /webhook` — Meta verification endpoint (responds with `hub.challenge`)
- `POST /webhook` — Receives incoming messages, delegates to message handler
- Starts the server on a configurable port

### whatsapp.js — Message Handler

- `isAllowedSender(phoneNumber)` — checks against `ALLOWED_PHONE_NUMBER`
- `extractEmailRequest(messageText)` — checks for "תכין לי מייל" prefix, returns the remaining text or null
- Handles the full flow: validate → extract → translate → generate → send

### translator.js — Translation

- `translateToEnglish(hebrewText)` — translates Hebrew to English
- Uses `google-translate-api-x` (no API key required)

### assistant.js — Email Generation

- `generateEmail(requestText)` — sends text to the OpenAI Assistant thread, returns `{ subject, body }`
- Uses a persistent thread (`OPENAI_THREAD_ID`) so the assistant accumulates context over time
- The assistant is pre-configured with instructions to output a clear subject line and email body

### mailer.js — Email Sending

- `sendEmail(subject, body)` — sends email via Gmail SMTP
- Uses Nodemailer with Gmail App Password authentication
- From: `GMAIL_USER`, To: `RECIPIENT_EMAIL`

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `WHATSAPP_VERIFY_TOKEN` | Token for Meta webhook verification |
| `WHATSAPP_ACCESS_TOKEN` | Meta WhatsApp API access token |
| `ALLOWED_PHONE_NUMBER` | The one phone number authorized to trigger emails |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_ASSISTANT_ID` | Pre-created OpenAI Assistant ID |
| `OPENAI_THREAD_ID` | Persistent thread ID for conversation continuity |
| `GMAIL_USER` | Gmail address used to send emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (requires 2FA enabled) |
| `RECIPIENT_EMAIL` | Fixed email address that receives all generated emails |

## Setup Requirements

### Meta WhatsApp Business
- Meta Developer account + app
- WhatsApp Business API configured (free tier: 1,000 conversations/month)
- Webhook URL pointing to the server's `/webhook` endpoint
- Access token generated

### OpenAI Assistant
- Assistant created via OpenAI dashboard or API
- Instructions: "You are an email writer. When given a topic, write a professional email. Always include a clear subject line on the first line prefixed with 'Subject: ', followed by a blank line, then the email body."
- A thread created and its ID saved
- Existing context can be fed manually when setting up the assistant

### Gmail
- 2FA enabled on the Gmail account
- App Password generated (Settings → Security → App Passwords)

### Hosting
- Publicly accessible server with HTTPS
- Options: Railway, Render, DigitalOcean, or any VPS

## Dependencies

- `express` — HTTP server
- `openai` — OpenAI Assistants API client
- `google-translate-api-x` — Free translation (no API key)
- `nodemailer` — Email sending via SMTP
- `dotenv` — Environment variable loading

## Error Handling

- If translation fails: log the error, skip the message
- If OpenAI API fails: log the error, skip the message
- If email sending fails: log the error, skip the message
- All errors are logged but no WhatsApp reply is sent (silent operation)

## Security

- Only messages from `ALLOWED_PHONE_NUMBER` are processed
- All secrets stored in `.env` (never committed to git)
- Meta webhook signature verification on incoming requests
