const { Project, ProjectStatus, UserRole } = require('../models');
const { createError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

const createProject = asyncHandler(async (req, res) => {
  const { title, description, requirements, budget, deadline } = req.body;

  const project = await Project.create({
    title,
    description,
    requirements,
    budget,
    deadline,
    buyerId: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: { project },
  });
});

const getAllProjects = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const user = req.user;
  let filter = {};

  if (status && Object.values(ProjectStatus).includes(status)) {
    filter.status = status;
  }

  // Role-based filtering
  if (user.role === UserRole.BUYER) {
    filter.buyerId = user._id;
  } else if (user.role === UserRole.PROBLEM_SOLVER) {
    // Problem solvers can see open projects or projects assigned to them
    if (!status) {
      filter.$or = [
        { status: ProjectStatus.OPEN },
        { assignedSolverId: user._id },
      ];
    }
  }
  // Admin can see all projects

  const projects = await Project.find(filter)
    .populate('buyerId', 'name email')
    .populate('assignedSolverId', 'name email profile')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { projects },
  });
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('buyerId', 'name email')
    .populate('assignedSolverId', 'name email profile');

  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Check access
  const user = req.user;
  if (user.role === UserRole.BUYER && !project.buyerId._id.equals(user._id)) {
    throw createError(403, 'Not authorized to view this project');
  }

  if (
    user.role === UserRole.PROBLEM_SOLVER &&
    project.status !== ProjectStatus.OPEN &&
    (!project.assignedSolverId || !project.assignedSolverId._id.equals(user._id))
  ) {
    throw createError(403, 'Not authorized to view this project');
  }

  res.json({
    success: true,
    data: { project },
  });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only buyer who created it can update
  if (!project.buyerId.equals(req.user._id) && req.user.role !== UserRole.ADMIN) {
    throw createError(403, 'Not authorized to update this project');
  }

  const { title, description, requirements, budget, deadline } = req.body;

  if (title) project.title = title;
  if (description) project.description = description;
  if (requirements !== undefined) project.requirements = requirements;
  if (budget !== undefined) project.budget = budget;
  if (deadline) project.deadline = deadline;

  await project.save();

  const updatedProject = await Project.findById(project._id)
    .populate('buyerId', 'name email')
    .populate('assignedSolverId', 'name email profile');

  res.json({
    success: true,
    data: { project: updatedProject },
  });
});

const updateProjectStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const project = await Project.findById(req.params.id);

  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only buyer can update status
  if (!project.buyerId.equals(req.user._id) && req.user.role !== UserRole.ADMIN) {
    throw createError(403, 'Not authorized to update project status');
  }

  if (!Object.values(ProjectStatus).includes(status)) {
    throw createError(400, 'Invalid status');
  }

  project.status = status;
  await project.save();

  const updatedProject = await Project.findById(project._id)
    .populate('buyerId', 'name email')
    .populate('assignedSolverId', 'name email profile');

  res.json({
    success: true,
    data: { project: updatedProject },
  });
});

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
};
