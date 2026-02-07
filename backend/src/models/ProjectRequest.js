const mongoose = require('mongoose');

const RequestStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

const projectRequestSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    solverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: RequestStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

projectRequestSchema.index({ projectId: 1, solverId: 1 }, { unique: true });
projectRequestSchema.index({ projectId: 1, status: 1 });

const ProjectRequest = mongoose.model('ProjectRequest', projectRequestSchema);

module.exports = { ProjectRequest, RequestStatus };
