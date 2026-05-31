const { validationResult } = require('express-validator');
const { validationErrorResponse } = require('../utils/response');

/**
 * Middleware kiem tra ket qua validation
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return validationErrorResponse(res, errors.array());
  }

  next();
};

module.exports = {
  validate,
};