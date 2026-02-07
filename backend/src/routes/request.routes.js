const express = require('express');
const { body } = require('express-validator');
const {
  createRequest,
  getRequestsForProject,
  getMyRequests,
  acceptRequest,
  rejectRequest,
} = require('../controllers/request.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { UserRole } = require('../models');

const router = express.Router();

router.use(protect);

router.get('/my', authorize(UserRole.PROBLEM_SOLVER), getMyRequests);

router.post(
  '/',
  authorize(UserRole.PROBLEM_SOLVER),
  [body('projectId').notEmpty().withMessage('Project ID is required')],
  validate,
  createRequest
);

router.get(
  '/project/:projectId',
  authorize(UserRole.BUYER, UserRole.ADMIN),
  getRequestsForProject
);

router.patch(
  '/:requestId/accept',
  authorize(UserRole.BUYER),
  acceptRequest
);

router.patch(
  '/:requestId/reject',
  authorize(UserRole.BUYER),
  rejectRequest
);

module.exports = router;
