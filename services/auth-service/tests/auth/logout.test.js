import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import request from 'supertest';

// Mock Redis before importing the application
const mockRedis = {
  set: jest.fn(),
};

jest.unstable_mockModule('../../src/config/redis.js', () => ({
  default: mockRedis,
}));

// Import app after registering the Redis mock
const { default: app } = await import('../../src/app.js');

process.env.JWT_SECRET ||= 'test-jwt-secret';

describe('POST /api/auth/logout', () => {
  let token;

  beforeEach(() => {
    jest.clearAllMocks();

    token = jwt.sign(
      {
        id: '673a12345678901234567890',
        username: 'dheeraj_123',
        email: 'dheeraj@example.com',
        role: 'user',
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      },
    );

    mockRedis.set.mockResolvedValue('OK');
  });

  // -------------------- SUCCESS CASES --------------------

  test('should logout successfully with a valid token', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', `token=${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');
  });

  test('should blacklist the hashed token in Redis', async () => {
    await request(app).post('/api/auth/logout').set('Cookie', `token=${token}`);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    expect(mockRedis.set).toHaveBeenCalledWith(
      `blacklist:${tokenHash}`,
      '1',
      'EX',
      expect.any(Number),
    );
  });

  test('should clear the authentication cookie', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', `token=${token}`);

    expect(response.headers['set-cookie']).toBeDefined();

    const cookie = response.headers['set-cookie'].join(';');

    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/Expires=/i);
  });

  test('should logout successfully when no token is provided', async () => {
    const response = await request(app).post('/api/auth/logout');

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');

    expect(mockRedis.set).not.toHaveBeenCalled();
    expect(response.headers['set-cookie']).toBeDefined();
  });

  // -------------------- FAILURE CASES --------------------

  test('should return an error if Redis fails', async () => {
    mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', `token=${token}`);

    expect(response.statusCode).toBe(500);
  });
});
