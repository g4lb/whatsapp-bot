# WhatsApp Email Bot

Receives WhatsApp messages with a Hebrew trigger phrase, translates them to English, generates a professional email using a configurable AI provider (OpenAI or Claude), and sends it via Gmail. Built with a layered architecture: routes, services, middleware, and providers.

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
- **LOG_LEVEL**: Log level for Winston logger: `debug`, `info` (default), `warn`, `error`
- **OPENAI_API_KEY**: Your OpenAI API key
- **OPENAI_ASSISTANT_ID**: Create an assistant at platform.openai.com with instructions: *"You are an email writer. When given a topic, write a professional email. Always include a clear subject line on the first line prefixed with 'Subject: ', followed by a blank line, then the email body."*
- **OPENAI_THREAD_ID**: Create a thread via the OpenAI API or dashboard
- **GMAIL_USER**: Your Gmail address
- **GMAIL_APP_PASSWORD**: Gmail App Password (enable 2FA first, then generate at myaccount.google.com → Security → App Passwords)
- **RECIPIENT_EMAIL**: The email address that receives all generated emails
- **EMAIL_PROVIDER**: Which AI provider to use: `openai` (default) or `claude`
- **ANTHROPIC_API_KEY**: Your Anthropic API key (required when EMAIL_PROVIDER=claude)

### Providers

**OpenAI (default):** Uses OpenAI Assistants API with a persistent thread. Requires `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`, and `OPENAI_THREAD_ID`.

**Claude:** Uses Claude API with SQLite-backed conversation history (stored in `data/conversations.db`, auto-created). Requires `ANTHROPIC_API_KEY`.

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
