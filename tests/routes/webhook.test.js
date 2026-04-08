const request = require('supertest');

describe('webhook routes', () => {
  let app;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, WHATSAPP_VERIFY_TOKEN: 'test-token' };
    jest.resetModules();
    app = require('../../src/app');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /webhook', () => {
    test('returns challenge when token matches', async () => {
      const res = await request(app)
        .get('/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test-token',
          'hub.challenge': 'test-challenge',
        });

      expect(res.status).toBe(200);
      expect(res.text).toBe('test-challenge');
    });

    test('returns 403 when token does not match', async () => {
      const res = await request(app)
        .get('/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': 'test-challenge',
        });

      expect(res.status).toBe(403);
    });

    test('returns 403 when mode is not subscribe', async () => {
      const res = await request(app)
        .get('/webhook')
        .query({
          'hub.mode': 'other',
          'hub.verify_token': 'test-token',
          'hub.challenge': 'test-challenge',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /webhook', () => {
    test('returns 200 for any POST body', async () => {
      const res = await request(app)
        .post('/webhook')
        .send({ entry: [] });

      expect(res.status).toBe(200);
    });
  });
});
