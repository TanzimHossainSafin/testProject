const jwt = require('jsonwebtoken');
const { User, UserRole } = require('../models');
const config = require('../config');
const { createError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError(400, 'Email already registered');
  }

  const user = await User.create({
    email,
    password,
    name,
    role: UserRole.PROBLEM_SOLVER,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw createError(401, 'Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError(401, 'Invalid credentials');
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
      token,
    },
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        profile: req.user.profile,
      },
    },
  });
});

module.exports = { register, login, getMe };
