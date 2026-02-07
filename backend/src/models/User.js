const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserRole = {
  ADMIN: 'admin',
  BUYER: 'buyer',
  PROBLEM_SOLVER: 'problem_solver',
};

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.PROBLEM_SOLVER,
    },
    profile: {
      bio: { type: String, default: '' },
      skills: [{ type: String }],
      experience: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = { User, UserRole };
