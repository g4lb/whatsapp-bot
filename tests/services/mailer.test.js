const { buildMailOptions } = require('../../src/services/mailer');

describe('buildMailOptions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GMAIL_USER: 'sender@gmail.com',
      RECIPIENT_EMAIL: 'recipient@example.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('builds correct mail options', () => {
    const options = buildMailOptions('Test Subject', 'Hello there');
    expect(options).toEqual({
      from: 'sender@gmail.com',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Hello there',
    });
  });
});
