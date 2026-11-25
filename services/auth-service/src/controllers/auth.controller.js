import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import redis from '../config/redis.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
};

const registerUser = async (req, res) => {
  const {
    username,
    email,
    password,
    fullName: { firstName, lastName },
    role,
  } = req.body;

  const isUserAlreadyExists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserAlreadyExists) {
    return res.status(409).json({
      message: 'Username or email already exists',
    });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hash,
    fullName: { firstName, lastName },
    role: role || 'user',
  });

  // Check whether JWT_SECRET is available
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing. Check your .env configuration.');
  }

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' },
  );

  res.cookie('token', token, cookieOptions);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      addresses: user.addresses,
    },
  });
};

const loginUser = async (req, res) => {
  try {
    const { username, email, identifier, password } = req.body;

    // Accept either a single identifier or the existing email/username fields.
    const loginIdentifier = (identifier || email || username || '').trim();

    // Validate required credentials
    if (!loginIdentifier || typeof password !== 'string' || !password) {
      return res.status(400).json({
        message: 'Username/email and password are required',
      });
    }

    // Ensure the JWT secret is configured before authentication
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is missing from environment variables.');
    }

    // Determine whether the identifier is an email or username
    const isEmail = loginIdentifier.includes('@');

    const userQuery = isEmail
      ? { email: loginIdentifier.toLowerCase() }
      : { username: loginIdentifier };

    // Retrieve the user and explicitly include the password field
    const user = await User.findOne(userQuery).select('+password');

    // Return the same error for unknown users and incorrect passwords
    if (!user || !user.password) {
      return res.status(401).json({
        message: 'Invalid username/email or password',
      });
    }

    // Compare the submitted password with the stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid username/email or password',
      });
    }

    // Generate JWT after successful authentication
    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: '1d',
        issuer: 'marketplace-auth',
        subject: user._id.toString(),
      },
    );

    // Store JWT in an HttpOnly cookie
    res.cookie('token', token, cookieOptions);

    // Return only safe user information
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    // Let Express error-handling middleware handle unexpected errors
    throw error;
  }
};

const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    message: 'Current user fetched successfully',
    user: req.user,
  });
};

const logoutUser = async (req, res) => {
  const token = req.cookies?.token;

  try {
    // Handle requests where the user is already logged out.
    if (!token) {
      const { maxAge, ...clearOptions } = cookieOptions;
      res.clearCookie('token', clearOptions);

      return res.status(200).json({
        message: 'Logged out successfully',
      });
    }

    // Decode the token to determine its remaining lifetime.
    const decoded = jwt.decode(token);

    const now = Math.floor(Date.now() / 1000);
    const maxTokenLifetime = 24 * 60 * 60;

    const remainingLifetime =
      typeof decoded?.exp === 'number' ? decoded.exp - now : maxTokenLifetime;

    // Blacklist the token while it is still valid.
    if (remainingLifetime > 0) {
      const ttl = Math.min(remainingLifetime, maxTokenLifetime);

      // Store a SHA-256 hash instead of the original JWT.
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await redis.set(`blacklist:${tokenHash}`, '1', 'EX', ttl);
    }

    // Clear the authentication cookie.
    const { maxAge, ...clearOptions } = cookieOptions;
    res.clearCookie('token', clearOptions);

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    throw error;
  }
};

const getUserAddresses = async (req, res) => {
  const id = req.user.id;

  const user = await User.findById(id).select('addresses');

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  return res.status(200).json({
    message: 'User addresses fetched successfully',
    addresses: user.addresses,
  });
};

const addUserAddresses = async (req, res) => {
  const id = req.user.id;

  const { street, city, state, pincode, country, phone, isDefault } = req.body;

  const user = await User.findOneAndUpdate(
    { _id: id },
    {
      $push: {
        addresses: {
          street,
          city,
          state,
          pincode,
          country,
          phone,
          isDefault,
        },
      },
    },
    {
      new: true,
    },
  );

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  return res.status(201).json({
    message: 'Address added successfully',
    address: user.addresses[user.addresses.length - 1],
  });
};

const deleteUserAdresses = async (req, res) => {
  const id = req.user.id;

  const { addressId } = req.params;

  const isAddressExists = await User.findOne({
    _id: id,
    'addresses._id': addressId,
  });

  if (!isAddressExists) {
    return res.status(404).json({
      message: 'Address not found',
    });
  }

  const user = await User.findOneAndUpdate(
    { _id: id },
    {
      $pull: {
        addresses: { _id: addressId },
      },
    },
    { new: true },
  );

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
    });
  }

  const addressExists = user.addresses.some(
    (addr) => addr._id.toString() === addressId,
  );
  if (addressExists) {
    return res.status(500).json({
      message: 'Failed to delete address',
    });
  }

  return res.status(200).json({
    message: 'Address deleted successfully',
    addresses: user.addresses,
  });
};

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  getUserAddresses,
  addUserAddresses,
  deleteUserAdresses,
};
