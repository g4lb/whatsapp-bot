const constants = require('../../src/utils/constants');

describe('constants', () => {
  test('exports TRIGGER_PHRASE', () => {
    expect(constants.TRIGGER_PHRASE).toBe('תכין לי מייל');
  });

  test('exports DEFAULT_PORT as number', () => {
    expect(constants.DEFAULT_PORT).toBe(3000);
  });

  test('exports DEFAULT_LOG_LEVEL', () => {
    expect(constants.DEFAULT_LOG_LEVEL).toBe('info');
  });

  test('exports DEFAULT_PROVIDER', () => {
    expect(constants.DEFAULT_PROVIDER).toBe('openai');
  });

  test('exports SUPPORTED_PROVIDERS array', () => {
    expect(constants.SUPPORTED_PROVIDERS).toEqual(['openai', 'claude']);
  });

  test('exports DEFAULT_SUBJECT', () => {
    expect(constants.DEFAULT_SUBJECT).toBe('Email Request');
  });

  test('exports EMAIL_PROMPT_PREFIX', () => {
    expect(constants.EMAIL_PROMPT_PREFIX).toBe('Write a professional email about:');
  });

  test('exports CLAUDE_MODEL', () => {
    expect(constants.CLAUDE_MODEL).toBe('claude-sonnet-4-20250514');
  });

  test('exports CLAUDE_MAX_TOKENS', () => {
    expect(constants.CLAUDE_MAX_TOKENS).toBe(1024);
  });

  test('exports CLAUDE_SYSTEM_PROMPT', () => {
    expect(typeof constants.CLAUDE_SYSTEM_PROMPT).toBe('string');
    expect(constants.CLAUDE_SYSTEM_PROMPT).toContain('email writer');
  });
});
