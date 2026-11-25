import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import app from '../../src/app.js';
import User from '../../src/models/user.model.js';

process.env.JWT_SECRET ||= 'test-jwt-secret';

describe('User Address APIs', () => {
  let user;
  let token;
  let addressId;

  const validAddress = {
    street: '221B Baker Street',
    city: 'London',
    state: 'Greater London',
    pincode: 'NW16XE',
    country: 'United Kingdom',
    phone: '+447123456789',
    isDefault: true,
  };

  const generateToken = (userId) => {
    return jwt.sign(
      {
        id: userId.toString(),
        username: 'dheeraj_123',
        email: 'dheeraj@example.com',
        role: 'user',
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );
  };

  beforeAll(async () => {
    await User.init();
  });

  beforeEach(async () => {
    user = await User.create({
      username: 'dheeraj_123',
      email: 'dheeraj@example.com',
      password: 'hashed-password',
      fullName: {
        firstName: 'Dheeraj',
        lastName: 'Mishra',
      },
      addresses: [validAddress],
    });

    token = generateToken(user._id);
    addressId = user.addresses[0]._id.toString();
  });

  // -------------------- GET USER ADDRESSES --------------------

  describe('GET /api/auth/users/me/addresses', () => {
    test('should fetch all addresses of the authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/users/me/addresses')
        .set('Cookie', `token=${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('User addresses fetched successfully');

      expect(response.body.addresses).toHaveLength(1);
      expect(response.body.addresses[0].street).toBe(validAddress.street);
    });

    test('should reject requests without authentication', async () => {
      const response = await request(app).get('/api/auth/users/me/addresses');

      expect(response.statusCode).toBe(401);
    });

    test('should return 404 if the authenticated user does not exist', async () => {
      const unknownUserId = new mongoose.Types.ObjectId();
      const unknownUserToken = generateToken(unknownUserId);

      const response = await request(app)
        .get('/api/auth/users/me/addresses')
        .set('Cookie', `token=${unknownUserToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('User not found');
    });
  });

  // -------------------- ADD USER ADDRESS --------------------

  describe('POST /api/auth/users/me/addresses', () => {
    test('should add a new address successfully', async () => {
      const newAddress = {
        street: '10 Downing Street',
        city: 'London',
        state: 'Greater London',
        pincode: 'SW1A2AA',
        country: 'United Kingdom',
        phone: '+447123456789',
        isDefault: false,
      };

      const response = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send(newAddress);

      expect(response.statusCode).toBe(201);
      expect(response.body.message).toBe('Address added successfully');
      expect(response.body.address.street).toBe(newAddress.street);
      expect(response.body.address.city).toBe(newAddress.city);

      const updatedUser = await User.findById(user._id);

      expect(updatedUser.addresses).toHaveLength(2);
    });

    test('should reject an address with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          city: 'London',
          country: 'United Kingdom',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should reject an invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          ...validAddress,
          phone: 'invalid-phone',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should reject an invalid isDefault value', async () => {
      const response = await request(app)
        .post('/api/auth/users/me/addresses')
        .set('Cookie', `token=${token}`)
        .send({
          ...validAddress,
          isDefault: 'yes',
        });

      expect(response.statusCode).toBe(400);
    });

    test('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/users/me/addresses')
        .send(validAddress);

      expect(response.statusCode).toBe(401);
    });
  });

  // -------------------- DELETE USER ADDRESS --------------------

  describe('DELETE /api/auth/users/me/addresses/:addressId', () => {
    test('should delete an existing address successfully', async () => {
      const response = await request(app)
        .delete(`/api/auth/users/me/addresses/${addressId}`)
        .set('Cookie', `token=${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe('Address deleted successfully');
      expect(response.body.addresses).toHaveLength(0);

      const updatedUser = await User.findById(user._id);

      expect(updatedUser.addresses).toHaveLength(0);
    });

    test('should return 404 if the address does not exist', async () => {
      const unknownAddressId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/auth/users/me/addresses/${unknownAddressId}`)
        .set('Cookie', `token=${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Address not found');
    });

    test('should not delete an address belonging to another user', async () => {
      const anotherUser = await User.create({
        username: 'another_user',
        email: 'another@example.com',
        password: 'hashed-password',
        fullName: {
          firstName: 'Another',
          lastName: 'User',
        },
        addresses: [validAddress],
      });

      const anotherAddressId = anotherUser.addresses[0]._id.toString();

      const response = await request(app)
        .delete(`/api/auth/users/me/addresses/${anotherAddressId}`)
        .set('Cookie', `token=${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Address not found');

      const unchangedUser = await User.findById(anotherUser._id);

      expect(unchangedUser.addresses).toHaveLength(1);
    });

    test('should reject requests without authentication', async () => {
      const response = await request(app).delete(
        `/api/auth/users/me/addresses/${addressId}`,
      );

      expect(response.statusCode).toBe(401);
    });
  });
});
