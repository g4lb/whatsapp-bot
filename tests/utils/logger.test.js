const logger = require('../../src/utils/logger');

describe('logger', () => {
  test('exports a winston logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  test('has default log level of info', () => {
    expect(logger.level).toBe('info');
  });

  test('supports child loggers', () => {
    const child = logger.child({ module: 'test' });
    expect(typeof child.info).toBe('function');
    expect(typeof child.error).toBe('function');
  });
});
