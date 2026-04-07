const path = require('path');
const Database = require('better-sqlite3');
const { buildMessages, getDb } = require('../../src/providers/claude');

describe('Claude provider', () => {
  let db;
  const testDbPath = path.join(__dirname, '../../data/test-conversations.db');

  beforeEach(() => {
    // Use in-memory DB for tests
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  });

  afterEach(() => {
    db.close();
  });

  describe('buildMessages', () => {
    test('builds messages array with no history', () => {
      const messages = buildMessages([], 'Write a professional email about: budget meeting');
      expect(messages).toEqual([
        { role: 'user', content: 'Write a professional email about: budget meeting' },
      ]);
    });

    test('builds messages array with existing history', () => {
      const history = [
        { role: 'user', content: 'Write a professional email about: project update' },
        { role: 'assistant', content: 'Subject: Project Update\n\nDear Team...' },
      ];
      const messages = buildMessages(history, 'Write a professional email about: budget meeting');
      expect(messages).toEqual([
        { role: 'user', content: 'Write a professional email about: project update' },
        { role: 'assistant', content: 'Subject: Project Update\n\nDear Team...' },
        { role: 'user', content: 'Write a professional email about: budget meeting' },
      ]);
    });
  });

  describe('SQLite operations', () => {
    test('saves and loads messages', () => {
      const insert = db.prepare('INSERT INTO messages (role, content) VALUES (?, ?)');
      insert.run('user', 'Write a professional email about: test');
      insert.run('assistant', 'Subject: Test\n\nThis is a test.');

      const rows = db.prepare('SELECT role, content FROM messages ORDER BY id').all();
      expect(rows).toEqual([
        { role: 'user', content: 'Write a professional email about: test' },
        { role: 'assistant', content: 'Subject: Test\n\nThis is a test.' },
      ]);
    });
  });
});
