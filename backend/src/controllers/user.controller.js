const { User, UserRole } = require('../models');
const { createError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

const getAllUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = {};

  if (role && Object.values(UserRole).includes(role)) {
    filter.role = role;
  }

  const users = await User.find(filter).select('-password');

  // Transform _id to id for consistency with frontend
  const transformedUsers = users.map(user => ({
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  res.json({
    success: true,
    data: { users: transformedUsers },
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw createError(404, 'User not found');
  }

  res.json({
    success: true,
    data: { user },
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!Object.values(UserRole).includes(role)) {
    throw createError(400, 'Invalid role');
  }

  if (role === UserRole.ADMIN) {
    throw createError(403, 'Cannot assign admin role');
  }

  const user = await User.findById(id);
  if (!user) {
    throw createError(404, 'User not found');
  }

  if (user.role === UserRole.ADMIN) {
    throw createError(403, 'Cannot change admin role');
  }

  user.role = role;
  await user.save();

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, profile } = req.body;
  const user = req.user;

  if (name) user.name = name;
  if (profile) {
    user.profile = { ...user.profile, ...profile };
  }

  await user.save();

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
    },
  });
});

module.exports = { getAllUsers, getUserById, updateUserRole, updateProfile };
