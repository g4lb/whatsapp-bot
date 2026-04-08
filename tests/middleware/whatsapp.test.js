const { isAllowedSender, extractEmailRequest } = require('../../src/middleware/whatsapp');

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
