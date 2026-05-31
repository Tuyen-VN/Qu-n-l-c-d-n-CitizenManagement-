/**
 * Response Helper - Tao cau truc response chuan
 */

/**
 * Response thanh cong
 * @param {object} res - Express response object
 * @param {*} data - Du lieu tra ve
 * @param {string} message - Thong bao
 * @param {number} statusCode - HTTP status code
 */
const successResponse = (res, data = null, message = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Response loi
 * @param {object} res - Express response object
 * @param {string} code - Ma loi
 * @param {string} message - Thong bao loi
 * @param {number} statusCode - HTTP status code
 * @param {array} details - Chi tiet loi (dung cho validation)
 */
const errorResponse = (
  res,
  code,
  message,
  statusCode = 400,
  details = null
) => {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details && details.length > 0) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Response validation error
 * @param {object} res - Express response object
 * @param {array} errors - Danh sach loi validation
 */
const validationErrorResponse = (res, errors) => {
  const details = errors.map((err) => ({
    field: err.param || err.field,
    message: err.msg || err.message,
  }));

  return errorResponse(
    res,
    'VALIDATION_ERROR',
    'Du lieu khong hop le',
    400,
    details
  );
};

/**
 * Response unauthorized
 * @param {object} res - Express response object
 * @param {string} message - Thong bao
 */
const unauthorizedResponse = (res, message = 'Khong co quyen truy cap') => {
  return errorResponse(res, 'UNAUTHORIZED', message, 401);
};

/**
 * Response forbidden
 * @param {object} res - Express response object
 * @param {string} message - Thong bao
 */
const forbiddenResponse = (res, message = 'Ban khong co quyen thuc hien thao tac nay') => {
  return errorResponse(res, 'FORBIDDEN', message, 403);
};

/**
 * Response not found
 * @param {object} res - Express response object
 * @param {string} message - Thong bao
 */
const notFoundResponse = (res, message = 'Khong tim thay du lieu') => {
  return errorResponse(res, 'NOT_FOUND', message, 404);
};

/**
 * Response conflict
 * @param {object} res - Express response object
 * @param {string} message - Thong bao
 */
const conflictResponse = (res, message = 'Du lieu da ton tai') => {
  return errorResponse(res, 'CONFLICT', message, 409);
};

/**
 * Response server error
 * @param {object} res - Express response object
 * @param {string} message - Thong bao
 */
const serverErrorResponse = (
  res,
  message = 'Loi he thong, vui long thu lai sau'
) => {
  return errorResponse(res, 'SERVER_ERROR', message, 500);
};

/**
 * Response pagination data
 * @param {object} res - Express response object
 * @param {array} data - Du lieu
 * @param {number} page - Trang hien tai
 * @param {number} pageSize - So ban ghi moi trang
 * @param {number} totalCount - Tong so ban ghi
 * @param {string} message - Thong bao
 */
const paginationResponse = (
  res,
  data,
  page,
  pageSize,
  totalCount,
  message = null
) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalCount: parseInt(totalCount),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  serverErrorResponse,
  paginationResponse,
};