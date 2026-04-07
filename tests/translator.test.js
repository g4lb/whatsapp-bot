const { translateToEnglish } = require('../src/translator');

describe('translateToEnglish', () => {
  test('translates Hebrew text to English', async () => {
    const result = await translateToEnglish('שלום');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns a string for longer Hebrew text', async () => {
    const result = await translateToEnglish('על הפגישה של מחר בנושא התקציב');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
}, 15000);
