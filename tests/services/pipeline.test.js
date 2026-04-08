jest.mock('../../src/middleware/whatsapp');
jest.mock('../../src/services/translator');
jest.mock('../../src/providers');
jest.mock('../../src/services/mailer');

const { isAllowedSender, extractEmailRequest } = require('../../src/middleware/whatsapp');
const { translateToEnglish } = require('../../src/services/translator');
const { getProvider } = require('../../src/providers');
const { sendEmail } = require('../../src/services/mailer');
const { processMessage } = require('../../src/services/pipeline');

describe('processMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isAllowedSender.mockReturnValue(true);
    extractEmailRequest.mockReturnValue('על הפגישה');
    translateToEnglish.mockResolvedValue('about the meeting');
    getProvider.mockReturnValue({
      generateEmail: jest.fn().mockResolvedValue({ subject: 'Meeting', body: 'Dear Team...' }),
    });
    sendEmail.mockResolvedValue();
  });

  test('processes a valid message through the full pipeline', async () => {
    const message = { from: '972501234567', text: { body: 'תכין לי מייל על הפגישה' } };
    await processMessage(message);

    expect(isAllowedSender).toHaveBeenCalledWith('972501234567');
    expect(extractEmailRequest).toHaveBeenCalledWith('תכין לי מייל על הפגישה');
    expect(translateToEnglish).toHaveBeenCalledWith('על הפגישה');
    expect(sendEmail).toHaveBeenCalledWith('Meeting', 'Dear Team...');
  });

  test('skips processing for disallowed sender', async () => {
    isAllowedSender.mockReturnValue(false);
    const message = { from: '999', text: { body: 'תכין לי מייל test' } };
    await processMessage(message);

    expect(translateToEnglish).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('skips processing when no trigger phrase', async () => {
    extractEmailRequest.mockReturnValue(null);
    const message = { from: '972501234567', text: { body: 'hello' } };
    await processMessage(message);

    expect(translateToEnglish).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('does not throw on pipeline error', async () => {
    translateToEnglish.mockRejectedValue(new Error('Translation API down'));
    const message = { from: '972501234567', text: { body: 'תכין לי מייל test' } };

    await expect(processMessage(message)).resolves.not.toThrow();
  });
});
