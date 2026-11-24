import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../src/app.js';
import User from '../../src/models/user.model.js';

process.env.JWT_SECRET ||= 'test-jwt-secret';

describe('POST /api/auth/login', () => {
  const validPassword = 'StrongPassword123';

  const createTestUser = async () => {
    const hashedPassword = await bcrypt.hash(validPassword, 10);

    return User.create({
      username: 'dheeraj_123',
      email: 'dheeraj@example.com',
      password: hashedPassword,
      fullName: {
        firstName: 'Dheeraj',
        lastName: 'Mishra',
      },
    });
  };

  beforeAll(async () => {
    await User.init();
  });

  // -------------------- SUCCESS CASES --------------------

  test('should login successfully using email', async () => {
    await createTestUser();

    const response = await request(app).post('/api/auth/login').send({
      identifier: 'dheeraj@example.com',
      password: validPassword,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.user.email).toBe('dheeraj@example.com');
    expect(response.body.user.username).toBe('dheeraj_123');
  });

  test('should login successfully using username', async () => {
    await createTestUser();

    const response = await request(app).post('/api/auth/login').send({
      identifier: 'dheeraj_123',
      password: validPassword,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.user.username).toBe('dheeraj_123');
  });

  test('should set an HttpOnly authentication cookie', async () => {
    await createTestUser();

    const response = await request(app).post('/api/auth/login').send({
      email: 'dheeraj@example.com',
      password: validPassword,
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'].join(';')).toMatch(/HttpOnly/i);
  });

  test('should not expose the password in the response', async () => {
    await createTestUser();

    const response = await request(app).post('/api/auth/login').send({
      identifier: 'dheeraj@example.com',
      password: validPassword,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.password).toBeUndefined();
  });

  // -------------------- FAILURE CASES --------------------

  test('should reject an incorrect password', async () => {
    await createTestUser();

    const response = await request(app).post('/api/auth/login').send({
      identifier: 'dheeraj@example.com',
      password: 'WrongPassword123',
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Invalid username/email or password');
  });

  test('should reject an unregistered email', async () => {
    const response = await request(app).post('/api/auth/login').send({
      identifier: 'unknown@example.com',
      password: validPassword,
    });

    expect(response.statusCode).toBe(401);
  });

  test('should reject a request without an identifier', async () => {
    const response = await request(app).post('/api/auth/login').send({
      password: validPassword,
    });

    expect(response.statusCode).toBe(400);
  });

  test('should reject a request without a password', async () => {
    const response = await request(app).post('/api/auth/login').send({
      identifier: 'dheeraj@example.com',
    });

    expect(response.statusCode).toBe(400);
  });
});
