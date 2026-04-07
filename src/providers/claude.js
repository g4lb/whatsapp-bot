const Anthropic = require('@anthropic-ai/sdk').default;
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { parseEmailResponse } = require('./parse');

const SYSTEM_PROMPT = 'You are an email writer. When given a topic, write a professional email. Always include a clear subject line on the first line prefixed with \'Subject: \', followed by a blank line, then the email body.';

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

  const userMessage = `Write a professional email about: ${requestText}`;
  const history = loadHistory(db);
  const messages = buildMessages(history, userMessage);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const responseText = response.content[0].text;

  saveMessage(db, 'user', userMessage);
  saveMessage(db, 'assistant', responseText);

  return parseEmailResponse(responseText);
}

module.exports = { generateEmail, buildMessages, getDb };
