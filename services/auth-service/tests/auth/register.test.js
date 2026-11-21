import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import app from '../../src/app.js';
import User from '../../src/models/user.model.js';

// Use a dedicated secret for the test environment.
process.env.JWT_SECRET =
  'd1b45351d023ab026154802aadb5f93130617f8405eaffaa405d4102da6c1c515e427c30f79c4fc9afc8e37e70314658378e80f453dbdc66086d4e925295525f';

const validUser = {
  username: 'dheeraj_123',
  email: 'dheeraj@example.com',
  password: 'StrongPassword123',
  fullName: {
    firstName: 'Dheeraj',
    lastName: 'Mishra',
  },
};

describe('POST /api/auth/register', () => {
  // Ensure MongoDB unique indexes exist before running registration tests.
  beforeAll(async () => {
    await User.init();
  });

  describe('Successful registration', () => {
    test('should register a new user and return 201', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
    });

    test('should return the registered user details', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.body.user).toEqual(
        expect.objectContaining({
          username: validUser.username,
          email: validUser.email,
          fullName: validUser.fullName,
          role: 'user',
        }),
      );

      expect(response.body.user.password).toBeUndefined();
    });

    test('should store the password as a bcrypt hash', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const user = await User.findOne({
        email: validUser.email,
      }).select('+password');

      expect(user).not.toBeNull();
      expect(user.password).not.toBe(validUser.password);

      const isPasswordValid = await bcrypt.compare(
        validUser.password,
        user.password,
      );

      expect(isPasswordValid).toBe(true);
    });

    test('should assign the default user role', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const user = await User.findOne({
        email: validUser.email,
      });

      expect(user.role).toBe('user');
    });

    test('should generate a valid JWT in an HttpOnly cookie', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      const cookies = response.headers['set-cookie'];

      expect(cookies).toBeDefined();

      const tokenCookie = cookies.find((cookie) => cookie.startsWith('token='));

      expect(tokenCookie).toBeDefined();
      expect(tokenCookie).toMatch(/HttpOnly/i);

      const token = tokenCookie.split(';')[0].substring('token='.length);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.email).toBe(validUser.email);
      expect(decoded.username).toBe(validUser.username);
      expect(decoded.role).toBe('user');
    });

    test('should persist the registered user in MongoDB', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const user = await User.findOne({
        email: validUser.email,
      });

      expect(user).not.toBeNull();
      expect(user.username).toBe(validUser.username);
    });
  });

  describe('Input validation', () => {
    test('should reject a missing username', async () => {
      const { username, ...payload } = validUser;

      const response = await request(app)
        .post('/api/auth/register')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should reject an invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should reject a password shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should reject a missing first name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          fullName: {
            lastName: 'Mishra',
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    test('should reject a missing last name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUser,
          fullName: {
            firstName: 'Dheeraj',
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Duplicate account validation', () => {
    test('should reject an already registered email', async () => {
      await User.create({
        ...validUser,
        username: 'existing_user',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Username or email already exists');
    });

    test('should reject an already registered username', async () => {
      await User.create({
        ...validUser,
        email: 'existing@example.com',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Username or email already exists');
    });
  });
});
