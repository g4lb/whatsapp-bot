const Anthropic = require('@anthropic-ai/sdk').default;
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { parseEmailResponse } = require('./parse');
const { EMAIL_PROMPT_PREFIX, CLAUDE_MODEL, CLAUDE_MAX_TOKENS, CLAUDE_SYSTEM_PROMPT } = require('../utils/constants');
const logger = require('../utils/logger').child({ module: 'provider:claude' });

let _anthropic = null;
function getAnthropic() {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

let _db = null;
function getDb() {
  if (!_db) {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    _db = new Database(path.join(dataDir, 'conversations.db'));
    _db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }
  return _db;
}

function loadHistory(db) {
  return db.prepare('SELECT role, content FROM messages ORDER BY id').all();
}

function saveMessage(db, role, content) {
  db.prepare('INSERT INTO messages (role, content) VALUES (?, ?)').run(role, content);
}

function buildMessages(history, newMessage) {
  const messages = history.map(({ role, content }) => ({ role, content }));
  messages.push({ role: 'user', content: newMessage });
  return messages;
}

async function generateEmail(requestText) {
  const anthropic = getAnthropic();
  const db = getDb();

  const userMessage = `${EMAIL_PROMPT_PREFIX} ${requestText}`;
  logger.info({ requestText }, 'Generating email via Claude');

  const history = loadHistory(db);
  const messages = buildMessages(history, userMessage);

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: CLAUDE_MAX_TOKENS,
    system: CLAUDE_SYSTEM_PROMPT,
    messages,
  });

  const responseText = response.content[0].text;

  saveMessage(db, 'user', userMessage);
  saveMessage(db, 'assistant', responseText);

  const result = parseEmailResponse(responseText);
  logger.info({ subject: result.subject }, 'Email generated via Claude');
  return result;
}

module.exports = { generateEmail, buildMessages, getDb };
