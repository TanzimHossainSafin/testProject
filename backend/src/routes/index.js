const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const projectRoutes = require('./project.routes');
const requestRoutes = require('./request.routes');
const taskRoutes = require('./task.routes');
const submissionRoutes = require('./submission.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/requests', requestRoutes);
router.use('/tasks', taskRoutes);
router.use('/submissions', submissionRoutes);

module.exports = router;
