const logger = require('../utils/logger');
const { serverErrorResponse, notFoundResponse } = require('../utils/response');

/**
 * Middleware xu ly 404 Not Found
 */
const notFound = (req, res, next) => {
  return notFoundResponse(
    res,
    `Khong tim thay duong dan: ${req.method} ${req.originalUrl}`
  );
};

/**
 * Middleware xu ly loi chung
 */
const errorHandler = (err, req, res, next) => {
  // Log loi
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId,
  });

  // Xu ly cac loai loi cu the
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token khong hop le hoac da het han',
      },
    });
  }

  // SQL Server errors
  if (err.number) {
    // Unique constraint violation
    if (err.number === 2627 || err.number === 2601) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Du lieu da ton tai trong he thong',
        },
      });
    }

    // Foreign key constraint violation
    if (err.number === 547) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REFERENCE_ERROR',
          message: 'Du lieu lien quan khong ton tai',
        },
      });
    }
  }

  // Loi mac dinh
  return serverErrorResponse(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Loi he thong, vui long thu lai sau'
      : err.message
  );
};

module.exports = {
  notFound,
  errorHandler,
};