const express = require('express');
const { body } = require('express-validator');
const {
  createTask,
  getTasksForProject,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { UserRole } = require('../models');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  authorize(UserRole.PROBLEM_SOLVER),
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
  ],
  validate,
  createTask
);

router.get('/project/:projectId', getTasksForProject);

router.get('/:id', getTaskById);

router.patch('/:id', authorize(UserRole.PROBLEM_SOLVER), updateTask);

router.delete('/:id', authorize(UserRole.PROBLEM_SOLVER), deleteTask);

module.exports = router;
