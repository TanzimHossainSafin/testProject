const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
} = require('../controllers/project.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { UserRole } = require('../models');

const router = express.Router();

router.use(protect);

router.get('/', getAllProjects);

router.post(
  '/',
  authorize(UserRole.BUYER),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
  ],
  validate,
  createProject
);

router.get('/:id', getProjectById);

router.patch(
  '/:id',
  authorize(UserRole.BUYER, UserRole.ADMIN),
  updateProject
);

router.patch(
  '/:id/status',
  authorize(UserRole.BUYER, UserRole.ADMIN),
  [body('status').notEmpty().withMessage('Status is required')],
  validate,
  updateProjectStatus
);

module.exports = router;
