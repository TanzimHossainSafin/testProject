const path = require('path');
const fs = require('fs');
const { Submission, SubmissionStatus, Task, TaskStatus, Project, ProjectStatus, UserRole } = require('../models');
const { createError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const config = require('../config');

const createSubmission = asyncHandler(async (req, res) => {
  const { taskId, notes } = req.body;

  if (!req.file) {
    throw createError(400, 'ZIP file is required');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw createError(404, 'Task not found');
  }

  const project = await Project.findById(task.projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only assigned solver can submit
  if (!project.assignedSolverId || !project.assignedSolverId.equals(req.user._id)) {
    throw createError(403, 'Not authorized to submit for this task');
  }

  if (task.status === TaskStatus.COMPLETED) {
    throw createError(400, 'Task is already completed');
  }

  const submission = await Submission.create({
    taskId,
    solverId: req.user._id,
    filePath: req.file.filename,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    notes: notes || '',
  });

  // Update task status to submitted
  task.status = TaskStatus.SUBMITTED;
  await task.save();

  res.status(201).json({
    success: true,
    data: { submission },
  });
});

const getSubmissionsForTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    throw createError(404, 'Task not found');
  }

  const project = await Project.findById(task.projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Check authorization
  const user = req.user;
  const isBuyer = project.buyerId.equals(user._id);
  const isSolver = project.assignedSolverId && project.assignedSolverId.equals(user._id);
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isBuyer && !isSolver && !isAdmin) {
    throw createError(403, 'Not authorized to view submissions');
  }

  const submissions = await Submission.find({ taskId })
    .populate('solverId', 'name email')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { submissions },
  });
});

const reviewSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { status, reviewNotes } = req.body;

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw createError(404, 'Submission not found');
  }

  const task = await Task.findById(submission.taskId);
  if (!task) {
    throw createError(404, 'Task not found');
  }

  const project = await Project.findById(task.projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only buyer or admin can review
  const isReviewerBuyer = project.buyerId.equals(req.user._id);
  const isReviewerAdmin = req.user.role === UserRole.ADMIN;
  if (!isReviewerBuyer && !isReviewerAdmin) {
    throw createError(403, 'Only buyer or admin can review submissions');
  }

  if (submission.status !== SubmissionStatus.PENDING) {
    throw createError(400, 'Submission has already been reviewed');
  }

  if (!Object.values(SubmissionStatus).includes(status) || status === SubmissionStatus.PENDING) {
    throw createError(400, 'Invalid status');
  }

  submission.status = status;
  submission.reviewNotes = reviewNotes || '';
  submission.reviewedAt = new Date();
  await submission.save();

  // Update task status based on review
  if (status === SubmissionStatus.APPROVED) {
    task.status = TaskStatus.COMPLETED;
  } else if (status === SubmissionStatus.REJECTED) {
    task.status = TaskStatus.REVISION_REQUESTED;
  }
  await task.save();

  // Check if all tasks are completed
  if (status === SubmissionStatus.APPROVED) {
    const incompleteTasks = await Task.countDocuments({
      projectId: project._id,
      status: { $ne: TaskStatus.COMPLETED },
    });

    if (incompleteTasks === 0) {
      project.status = ProjectStatus.COMPLETED;
      await project.save();
    }
  }

  const updatedSubmission = await Submission.findById(submissionId)
    .populate('solverId', 'name email');

  res.json({
    success: true,
    data: { submission: updatedSubmission },
  });
});

const downloadSubmission = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw createError(404, 'Submission not found');
  }

  const task = await Task.findById(submission.taskId);
  if (!task) {
    throw createError(404, 'Task not found');
  }

  const project = await Project.findById(task.projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Check authorization
  const user = req.user;
  const isBuyer = project.buyerId.equals(user._id);
  const isSolver = project.assignedSolverId && project.assignedSolverId.equals(user._id);
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isBuyer && !isSolver && !isAdmin) {
    throw createError(403, 'Not authorized to download this file');
  }

  const filePath = path.join(config.uploadDir, submission.filePath);

  if (!fs.existsSync(filePath)) {
    throw createError(404, 'File not found');
  }

  res.download(filePath, submission.fileName);
});

module.exports = {
  createSubmission,
  getSubmissionsForTask,
  reviewSubmission,
  downloadSubmission,
};
