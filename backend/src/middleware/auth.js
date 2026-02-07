const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, UserRole } = require('../models');
const { createError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw createError(401, 'Not authorized to access this route');
  }

  const decoded = jwt.verify(token, config.jwtSecret);
  const user = await User.findById(decoded.id);

  if (!user) {
    throw createError(401, 'User not found');
  }

  req.user = user;
  next();
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw createError(403, 'Not authorized to perform this action');
    }
    next();
  };
};

module.exports = { protect, authorize };
