const mongoose = require('mongoose');

const ProjectStatus = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: String,
      default: '',
    },
    budget: {
      type: Number,
    },
    deadline: {
      type: Date,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedSolverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.OPEN,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ status: 1 });
projectSchema.index({ buyerId: 1 });
projectSchema.index({ assignedSolverId: 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = { Project, ProjectStatus };
