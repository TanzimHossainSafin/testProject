const { ProjectRequest, RequestStatus, Project, ProjectStatus, UserRole } = require('../models');
const { createError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');

const createRequest = asyncHandler(async (req, res) => {
  const { projectId, message } = req.body;
  const solverId = req.user._id;

  const project = await Project.findById(projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  if (project.status !== ProjectStatus.OPEN) {
    throw createError(400, 'Project is not accepting requests');
  }

  const existingRequest = await ProjectRequest.findOne({ projectId, solverId });
  if (existingRequest) {
    throw createError(400, 'You have already requested to work on this project');
  }

  const request = await ProjectRequest.create({
    projectId,
    solverId,
    message,
  });

  const populatedRequest = await ProjectRequest.findById(request._id)
    .populate('solverId', 'name email profile')
    .populate('projectId', 'title');

  res.status(201).json({
    success: true,
    data: { request: populatedRequest },
  });
});

const getRequestsForProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only buyer of the project or admin can see requests
  if (!project.buyerId.equals(req.user._id) && req.user.role !== UserRole.ADMIN) {
    throw createError(403, 'Not authorized to view requests');
  }

  const requests = await ProjectRequest.find({ projectId })
    .populate('solverId', 'name email profile')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { requests },
  });
});

const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await ProjectRequest.find({ solverId: req.user._id })
    .populate('projectId', 'title status buyerId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { requests },
  });
});

const acceptRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const request = await ProjectRequest.findById(requestId);
  if (!request) {
    throw createError(404, 'Request not found');
  }

  const project = await Project.findById(request.projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only buyer of the project can accept
  if (!project.buyerId.equals(req.user._id)) {
    throw createError(403, 'Not authorized to accept this request');
  }

  if (project.status !== ProjectStatus.OPEN) {
    throw createError(400, 'Project is already assigned');
  }

  // Accept this request
  request.status = RequestStatus.ACCEPTED;
  await request.save();

  // Reject all other pending requests
  await ProjectRequest.updateMany(
    {
      projectId: request.projectId,
      _id: { $ne: requestId },
      status: RequestStatus.PENDING,
    },
    { status: RequestStatus.REJECTED }
  );

  // Assign solver to project
  project.assignedSolverId = request.solverId;
  project.status = ProjectStatus.ASSIGNED;
  await project.save();

  const updatedRequest = await ProjectRequest.findById(requestId)
    .populate('solverId', 'name email profile')
    .populate('projectId', 'title status');

  res.json({
    success: true,
    data: { request: updatedRequest },
  });
});

const rejectRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const request = await ProjectRequest.findById(requestId);
  if (!request) {
    throw createError(404, 'Request not found');
  }

  const project = await Project.findById(request.projectId);
  if (!project) {
    throw createError(404, 'Project not found');
  }

  // Only buyer of the project can reject
  if (!project.buyerId.equals(req.user._id)) {
    throw createError(403, 'Not authorized to reject this request');
  }

  request.status = RequestStatus.REJECTED;
  await request.save();

  res.json({
    success: true,
    data: { request },
  });
});

module.exports = {
  createRequest,
  getRequestsForProject,
  getMyRequests,
  acceptRequest,
  rejectRequest,
};
