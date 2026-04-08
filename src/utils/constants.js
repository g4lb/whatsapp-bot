module.exports = {
  // WhatsApp
  TRIGGER_PHRASE: 'תכין לי מייל',

  // Server
  DEFAULT_PORT: 3000,
  DEFAULT_LOG_LEVEL: 'info',

  // Providers
  DEFAULT_PROVIDER: 'openai',
  SUPPORTED_PROVIDERS: ['openai', 'claude'],

  // Email
  DEFAULT_SUBJECT: 'Email Request',
  EMAIL_PROMPT_PREFIX: 'Write a professional email about:',

  // Claude
  CLAUDE_MODEL: 'claude-sonnet-4-20250514',
  CLAUDE_MAX_TOKENS: 1024,
  CLAUDE_SYSTEM_PROMPT: 'You are an email writer. When given a topic, write a professional email. Always include a clear subject line on the first line prefixed with \'Subject: \', followed by a blank line, then the email body.',
};
