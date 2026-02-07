const express = require('express');
const { body } = require('express-validator');
const {
  createSubmission,
  getSubmissionsForTask,
  reviewSubmission,
  downloadSubmission,
} = require('../controllers/submission.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const { UserRole } = require('../models');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  authorize(UserRole.PROBLEM_SOLVER),
  upload.single('file'),
  [body('taskId').notEmpty().withMessage('Task ID is required')],
  validate,
  createSubmission
);

router.get('/task/:taskId', getSubmissionsForTask);

router.patch(
  '/:submissionId/review',
  authorize(UserRole.BUYER),
  [body('status').notEmpty().withMessage('Status is required')],
  validate,
  reviewSubmission
);

router.get('/:submissionId/download', downloadSubmission);

module.exports = router;
