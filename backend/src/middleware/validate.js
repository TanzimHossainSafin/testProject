const { validationResult } = require('express-validator');
const { createError } = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    throw createError(400, messages.join(', '));
  }

  next();
};

module.exports = { validate };
