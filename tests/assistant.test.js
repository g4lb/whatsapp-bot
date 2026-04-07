const { parseEmailResponse } = require('../src/assistant');

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
