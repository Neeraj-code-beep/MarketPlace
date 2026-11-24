import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';

process.env.JWT_SECRET ||= 'test-jwt-secret';

describe('GET /api/auth/me', () => {
  const testUser = {
    id: '673a12345678901234567890',
    username: 'dheeraj_123',
    email: 'dheeraj@example.com',
    role: 'user',
  };

  const generateToken = (payload = testUser, options = {}) => {
    return jwt.sign(payload, process.env.JWT_SECRET, options);
  };

  // -------------------- SUCCESS CASES --------------------

  test('should return current user with a valid JWT', async () => {
    const token = generateToken();

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Current user fetched successfully');
    expect(response.body.user.id).toBe(testUser.id);
    expect(response.body.user.username).toBe(testUser.username);
    expect(response.body.user.email).toBe(testUser.email);
    expect(response.body.user.role).toBe(testUser.role);
  });

  // -------------------- FAILURE CASES --------------------

  test('should reject a request without a token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  test('should reject an invalid JWT', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=invalid-token');

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  test('should reject an expired JWT', async () => {
    const expiredToken = generateToken(testUser, {
      expiresIn: '-1s',
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${expiredToken}`);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  test('should reject a token signed with a different secret', async () => {
    const wrongToken = jwt.sign(testUser, 'another-secret');

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${wrongToken}`);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });
});
