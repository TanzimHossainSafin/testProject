const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateProfile,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { UserRole } = require('../models');

const router = express.Router();

router.use(protect);

router.get('/', getAllUsers);

router.get('/:id', getUserById);

router.patch(
  '/:id/role',
  authorize(UserRole.ADMIN),
  [body('role').notEmpty().withMessage('Role is required')],
  validate,
  updateUserRole
);

router.patch('/profile/update', updateProfile);

module.exports = router;
