# Provider Abstraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor email generation into a pluggable provider system supporting OpenAI and Claude, with easy addition of future providers.

**Architecture:** Extract shared parsing logic, move OpenAI code to its own provider file, add a Claude provider with SQLite-backed conversation history, and wire them together via a factory that reads `EMAIL_PROVIDER` env var.

**Tech Stack:** Node.js, OpenAI SDK, @anthropic-ai/sdk, better-sqlite3, Jest

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/providers/parse.js` | Create | Shared `parseEmailResponse` (extracted from assistant.js) |
| `src/providers/openai.js` | Create | OpenAI Assistants API `generateEmail` (moved from assistant.js) |
| `src/providers/claude.js` | Create | Claude API `generateEmail` with SQLite history |
| `src/providers/index.js` | Create | Factory: `getProvider()` reads env var, returns provider |
| `src/assistant.js` | Delete | Replaced by providers/openai.js + providers/parse.js |
| `src/index.js` | Modify | Change import from `./assistant` to `./providers` |
| `tests/assistant.test.js` | Delete | Replaced by tests/providers/parse.test.js |
| `tests/providers/parse.test.js` | Create | parseEmailResponse tests (moved from assistant.test.js) |
| `tests/providers/index.test.js` | Create | Factory tests |
| `tests/providers/claude.test.js` | Create | Claude provider tests (SQLite + message formatting) |
| `.env.example` | Modify | Add EMAIL_PROVIDER, ANTHROPIC_API_KEY |
| `.gitignore` | Modify | Add data/ |
| `package.json` | Modify | Add @anthropic-ai/sdk, better-sqlite3 |

---

### Task 1: Extract Shared Parser

**Files:**
- Create: `src/providers/parse.js`
- Create: `tests/providers/parse.test.js`
- Delete: `tests/assistant.test.js`

- [ ] **Step 1: Create the providers directory**

```bash
mkdir -p src/providers tests/providers
```

- [ ] **Step 2: Write the failing test**

Create `tests/providers/parse.test.js`:

```javascript
const { parseEmailResponse } = require('../../src/providers/parse');

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

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest tests/providers/parse.test.js --verbose
```

Expected: FAIL — `Cannot find module '../../src/providers/parse'`

- [ ] **Step 4: Write the implementation**

Create `src/providers/parse.js`:

```javascript
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

module.exports = { parseEmailResponse };
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest tests/providers/parse.test.js --verbose
```

Expected: All 3 tests PASS

- [ ] **Step 6: Delete old test file**

```bash
rm tests/assistant.test.js
```

- [ ] **Step 7: Commit**

```bash
git add src/providers/parse.js tests/providers/parse.test.js
git rm tests/assistant.test.js
git commit -m "refactor: extract parseEmailResponse to shared providers/parse module"
```

---

### Task 2: Move OpenAI Provider

**Files:**
- Create: `src/providers/openai.js`
- Delete: `src/assistant.js`

- [ ] **Step 1: Create the OpenAI provider**

Create `src/providers/openai.js`:

```javascript
const OpenAI = require('openai');
const { parseEmailResponse } = require('./parse');

let _openai = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

async function generateEmail(requestText) {
  const openai = getOpenAI();

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

module.exports = { generateEmail };
```

- [ ] **Step 2: Delete old assistant.js**

```bash
git rm src/assistant.js
```

- [ ] **Step 3: Run all tests to verify nothing broke**

```bash
npx jest --verbose
```

Expected: All tests pass (parse tests use new path, translator/whatsapp/mailer tests unaffected). Note: `src/index.js` still imports from `./assistant` — that's OK because we don't test `index.js` directly and we'll fix it in Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/providers/openai.js
git commit -m "refactor: move OpenAI email generation to providers/openai module"
```

---

### Task 3: Create Claude Provider

**Files:**
- Create: `src/providers/claude.js`
- Create: `tests/providers/claude.test.js`

- [ ] **Step 1: Install new dependencies**

```bash
npm install @anthropic-ai/sdk better-sqlite3
```

- [ ] **Step 2: Write the failing tests**

Create `tests/providers/claude.test.js`:

```javascript
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
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx jest tests/providers/claude.test.js --verbose
```

Expected: FAIL — `Cannot find module '../../src/providers/claude'`

- [ ] **Step 4: Write the implementation**

Create `src/providers/claude.js`:

```javascript
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
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest tests/providers/claude.test.js --verbose
```

Expected: All 3 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/providers/claude.js tests/providers/claude.test.js package.json package-lock.json
git commit -m "feat: add Claude email generation provider with SQLite history"
```

---

### Task 4: Create Provider Factory + Wire Up

**Files:**
- Create: `src/providers/index.js`
- Create: `tests/providers/index.test.js`
- Modify: `src/index.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/providers/index.test.js`:

```javascript
describe('getProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear require cache so factory re-reads env
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns openai provider by default', () => {
    delete process.env.EMAIL_PROVIDER;
    const { getProvider } = require('../../src/providers');
    const provider = getProvider();
    expect(typeof provider.generateEmail).toBe('function');
  });

  test('returns openai provider when EMAIL_PROVIDER=openai', () => {
    process.env.EMAIL_PROVIDER = 'openai';
    const { getProvider } = require('../../src/providers');
    const provider = getProvider();
    expect(typeof provider.generateEmail).toBe('function');
  });

  test('returns claude provider when EMAIL_PROVIDER=claude', () => {
    process.env.EMAIL_PROVIDER = 'claude';
    const { getProvider } = require('../../src/providers');
    const provider = getProvider();
    expect(typeof provider.generateEmail).toBe('function');
  });

  test('throws on unknown provider', () => {
    process.env.EMAIL_PROVIDER = 'unknown';
    const { getProvider } = require('../../src/providers');
    expect(() => getProvider()).toThrow('Unknown EMAIL_PROVIDER: "unknown". Supported: openai, claude');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest tests/providers/index.test.js --verbose
```

Expected: FAIL — `Cannot find module '../../src/providers'`

- [ ] **Step 3: Write the factory implementation**

Create `src/providers/index.js`:

```javascript
const PROVIDERS = {
  openai: () => require('./openai'),
  claude: () => require('./claude'),
};

function getProvider() {
  const name = process.env.EMAIL_PROVIDER || 'openai';
  const loader = PROVIDERS[name];

  if (!loader) {
    const supported = Object.keys(PROVIDERS).join(', ');
    throw new Error(`Unknown EMAIL_PROVIDER: "${name}". Supported: ${supported}`);
  }

  return loader();
}

module.exports = { getProvider };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest tests/providers/index.test.js --verbose
```

Expected: All 4 tests PASS

- [ ] **Step 5: Update src/index.js**

Change line 5 of `src/index.js` from:

```javascript
const { generateEmail } = require('./assistant');
```

To:

```javascript
const { generateEmail } = require('./providers').getProvider();
```

- [ ] **Step 6: Run all tests**

```bash
npx jest --verbose
```

Expected: All tests pass (parse: 3, claude: 3, factory: 4, whatsapp: 8, translator: 2, mailer: 1 = 21 total)

- [ ] **Step 7: Commit**

```bash
git add src/providers/index.js tests/providers/index.test.js src/index.js
git commit -m "feat: add provider factory and wire up to Express server"
```

---

### Task 5: Update Config Files + Cleanup

**Files:**
- Modify: `.env.example`
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Update .env.example**

Add these lines after `RECIPIENT_EMAIL=recipient@example.com`:

```
EMAIL_PROVIDER=openai
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
```

- [ ] **Step 2: Update .gitignore**

Add `data/` to `.gitignore`:

```
node_modules/
.env
data/
```

- [ ] **Step 3: Update README.md**

Read the current README and update it. Add `EMAIL_PROVIDER` and `ANTHROPIC_API_KEY` to the environment variables section. Add a "Providers" section after the "Setup" section:

Add to the env vars list in README after the `RECIPIENT_EMAIL` entry:

```markdown
- **EMAIL_PROVIDER**: Which AI provider to use: `openai` (default) or `claude`
- **ANTHROPIC_API_KEY**: Your Anthropic API key (required when EMAIL_PROVIDER=claude)
```

Add a new section after the env vars list but before "### 3. Start the server":

```markdown
### Providers

**OpenAI (default):** Uses OpenAI Assistants API with a persistent thread. Requires `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`, and `OPENAI_THREAD_ID`.

**Claude:** Uses Claude API with SQLite-backed conversation history (stored in `data/conversations.db`, auto-created). Requires `ANTHROPIC_API_KEY`.
```

- [ ] **Step 4: Run all tests one final time**

```bash
npx jest --verbose
```

Expected: All 21 tests pass

- [ ] **Step 5: Commit**

```bash
git add .env.example .gitignore README.md
git commit -m "docs: update config and README for multi-provider support"
```
