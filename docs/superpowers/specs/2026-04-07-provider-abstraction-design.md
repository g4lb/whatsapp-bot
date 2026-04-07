# Provider Abstraction — Design Spec

## Overview

Refactor email generation to support multiple AI providers behind a common interface. Currently hardcoded to OpenAI Assistants API. After this change, the bot supports OpenAI and Claude (with SQLite-backed conversation history), and adding future providers requires only one new file and one factory case.

## Provider Interface

Every provider exports:

```javascript
{ generateEmail(requestText) → Promise<{ subject: string, body: string }> }
```

A factory function (`getProvider()`) reads `EMAIL_PROVIDER` env var and returns the matching provider.

## File Structure

```
src/providers/
├── index.js        — getProvider(): reads EMAIL_PROVIDER, returns { generateEmail }
├── parse.js        — parseEmailResponse(): shared Subject:/body parsing
├── openai.js       — generateEmail() via OpenAI Assistants API (moved from assistant.js)
└── claude.js       — generateEmail() via Claude API + SQLite history
```

### src/providers/index.js — Factory

- Reads `process.env.EMAIL_PROVIDER` (default: `'openai'`)
- Returns the matching provider module's `{ generateEmail }`
- Supported values: `'openai'`, `'claude'`
- Throws on unknown provider value

### src/providers/parse.js — Shared Parser

- `parseEmailResponse(responseText)` — extracted from current `assistant.js`
- Parses "Subject: ..." from first line, returns `{ subject, body }`
- Falls back to `{ subject: 'Email Request', body: responseText }` if no prefix
- Used by all providers

### src/providers/openai.js — OpenAI Provider

- `generateEmail(requestText)` — current logic from `assistant.js`
- Uses lazy OpenAI client initialization (existing pattern)
- Uses persistent thread via `OPENAI_THREAD_ID` and `OPENAI_ASSISTANT_ID`
- Calls `parseEmailResponse` from `./parse.js`

### src/providers/claude.js — Claude Provider

- `generateEmail(requestText)` — sends request to Claude API with full conversation history
- Uses `@anthropic-ai/sdk` package
- Uses `better-sqlite3` for conversation history persistence
- System prompt: "You are an email writer. When given a topic, write a professional email. Always include a clear subject line on the first line prefixed with 'Subject: ', followed by a blank line, then the email body."
- Flow:
  1. Load all previous messages from SQLite
  2. Append new user message: "Write a professional email about: {requestText}"
  3. Call Claude API with system prompt + full message history
  4. Save assistant response to SQLite
  5. Parse response with `parseEmailResponse` and return `{ subject, body }`
- Calls `parseEmailResponse` from `./parse.js`

## SQLite Schema

Database file: `data/conversations.db` (auto-created on first use)

```sql
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

- `role`: `'user'` or `'assistant'`
- `content`: the full message text
- Table is created automatically if it doesn't exist

## Changes to Existing Files

### src/index.js

- Replace `const { generateEmail } = require('./assistant');`
- With `const { generateEmail } = require('./providers').getProvider();`
- This runs once at module load time (not per-request) — the provider is fixed for the lifetime of the process
- `generateEmail` usage in the POST handler stays identical

### src/assistant.js — Deleted

Logic moves to:
- `src/providers/openai.js` (generateEmail + OpenAI client)
- `src/providers/parse.js` (parseEmailResponse)

### tests/assistant.test.js — Deleted

Replaced by:
- `tests/providers/parse.test.js` — same parseEmailResponse tests
- `tests/providers/claude.test.js` — Claude-specific tests (message history formatting)
- `tests/providers/index.test.js` — factory tests

### .env.example — Add

```
EMAIL_PROVIDER=openai
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

### .gitignore — Add

```
data/
```

### package.json — Add dependencies

- `@anthropic-ai/sdk`
- `better-sqlite3`

## Environment Variables

| Variable | Description | Required When |
|---|---|---|
| `EMAIL_PROVIDER` | `openai` or `claude` (default: `openai`) | Always |
| `OPENAI_API_KEY` | OpenAI API key | EMAIL_PROVIDER=openai |
| `OPENAI_ASSISTANT_ID` | Pre-created assistant ID | EMAIL_PROVIDER=openai |
| `OPENAI_THREAD_ID` | Persistent thread ID | EMAIL_PROVIDER=openai |
| `ANTHROPIC_API_KEY` | Anthropic API key | EMAIL_PROVIDER=claude |

## Error Handling

- Unknown `EMAIL_PROVIDER` value: throw at startup with clear message
- Claude API failure: log error, skip message (same as OpenAI behavior)
- SQLite errors: log error, skip message

## Testing

- `tests/providers/parse.test.js` — parseEmailResponse (moved from assistant.test.js, same tests)
- `tests/providers/index.test.js` — factory returns correct provider, throws on unknown
- `tests/providers/claude.test.js` — message history formatting, SQLite read/write
