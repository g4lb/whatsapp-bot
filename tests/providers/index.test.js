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
