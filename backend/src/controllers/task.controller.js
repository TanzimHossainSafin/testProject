const { Task, TaskStatus, Project, ProjectStatus, UserRole } = require('../models');
const { createError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

const createTask = asyncHandler(async (req, res) => {
  const { projectId, title, description, deadline } = req.body;

  const project = await Project.findById(projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only assigned solver can create tasks
  if (!project.assignedSolverId || !project.assignedSolverId.equals(req.user._id)) {
    throw createError(403, 'Only assigned problem solver can create tasks');
  }

  if (project.status === ProjectStatus.COMPLETED || project.status === ProjectStatus.CANCELLED) {
    throw createError(400, 'Cannot add tasks to completed or cancelled project');
  }

  // Get the highest order for ordering
  const lastTask = await Task.findOne({ projectId }).sort({ order: -1 });
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({
    projectId,
    title,
    description,
    deadline,
    order,
  });

  // Update project status to in_progress if it was just assigned
  if (project.status === ProjectStatus.ASSIGNED) {
    project.status = ProjectStatus.IN_PROGRESS;
    await project.save();
  }

  res.status(201).json({
    success: true,
    data: { task },
  });
});

const getTasksForProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Check authorization
  const user = req.user;
  const isBuyer = project.buyerId.equals(user._id);
  const isSolver = project.assignedSolverId && project.assignedSolverId.equals(user._id);
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isBuyer && !isSolver && !isAdmin) {
    throw createError(403, 'Not authorized to view tasks');
  }

  const tasks = await Task.find({ projectId }).sort({ order: 1 });

  res.json({
    success: true,
    data: { tasks },
  });
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('projectId');

  if (!task) {
    throw createError(404, 'Task not found');
  }

  res.json({
    success: true,
    data: { task },
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw createError(404, 'Task not found');
  }

  const project = await Project.findById(task.projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only assigned solver can update
  if (!project.assignedSolverId || !project.assignedSolverId.equals(req.user._id)) {
    throw createError(403, 'Not authorized to update this task');
  }

  const { title, description, deadline, status } = req.body;

  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (deadline) task.deadline = deadline;
  if (status && Object.values(TaskStatus).includes(status)) {
    // Validate state transitions
    if (status === TaskStatus.COMPLETED) {
      throw createError(400, 'Task can only be marked complete by buyer');
    }
    task.status = status;
  }

  await task.save();

  res.json({
    success: true,
    data: { task },
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw createError(404, 'Task not found');
  }

  const project = await Project.findById(task.projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only assigned solver can delete
  if (!project.assignedSolverId || !project.assignedSolverId.equals(req.user._id)) {
    throw createError(403, 'Not authorized to delete this task');
  }

  if (task.status === TaskStatus.COMPLETED) {
    throw createError(400, 'Cannot delete completed task');
  }

  await Task.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Task deleted successfully',
  });
});

module.exports = {
  createTask,
  getTasksForProject,
  getTaskById,
  updateTask,
  deleteTask,
};
