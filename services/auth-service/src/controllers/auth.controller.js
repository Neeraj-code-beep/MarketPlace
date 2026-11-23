import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const cookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

const registerUser = async (req, res) => {
  const {
    username,
    email,
    password,
    fullName: { firstName, lastName },
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

export default {
  registerUser,
  loginUser,
  getCurrentUser,
};
