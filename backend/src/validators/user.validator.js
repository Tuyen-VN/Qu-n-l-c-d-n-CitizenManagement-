const { body, param, query } = require('express-validator');

/**
 * Validation cho tao nguoi dung moi
 */
const createUserValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Ten dang nhap la bat buoc')
    .isLength({ min: 3, max: 50 })
    .withMessage('Ten dang nhap phai co tu 3-50 ky tu')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Ten dang nhap chi duoc chua chu cai, so va dau gach duoi'),

  body('password')
    .notEmpty()
    .withMessage('Mat khau la bat buoc')
    .isLength({ min: 8 })
    .withMessage('Mat khau phai co it nhat 8 ky tu')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mat khau phai co chu hoa, chu thuong va so'),

  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Ho va ten la bat buoc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Ho va ten phai co tu 2-100 ky tu'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email khong hop le')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('So dien thoai khong hop le (10-11 chu so)'),

  body('role_id')
    .notEmpty()
    .withMessage('Role la bat buoc')
    .isInt({ min: 1 })
    .withMessage('Role khong hop le'),

  body('ward_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Phuong/xa khong hop le'),
];

/**
 * Validation cho cap nhat nguoi dung
 */
const updateUserValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Ten dang nhap phai co tu 3-50 ky tu')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Ten dang nhap chi duoc chua chu cai, so va dau gach duoi'),

  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ho va ten phai co tu 2-100 ky tu'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email khong hop le')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('So dien thoai khong hop le'),

  body('ward_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Phuong/xa khong hop le'),
];

/**
 * Validation cho thay doi trang thai
 */
const updateStatusValidation = [
  body('is_active')
    .notEmpty()
    .withMessage('Trang thai la bat buoc')
    .isBoolean()
    .withMessage('Trang thai phai la true hoac false'),
];

/**
 * Validation cho reset mat khau
 */
const resetPasswordValidation = [
  body('new_password')
    .notEmpty()
    .withMessage('Mat khau moi la bat buoc')
    .isLength({ min: 8 })
    .withMessage('Mat khau phai co it nhat 8 ky tu')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mat khau phai co chu hoa, chu thuong va so'),
];

/**
 * Validation cho ID param
 */
const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID khong hop le'),
];

/**
 * Validation cho query params
 */
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phai la so nguyen duong'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Kich thuoc trang phai tu 1-100'),

  query('roleId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Role ID khong hop le'),

  query('wardId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ward ID khong hop le'),

  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Trang thai phai la true hoac false'),
];

/**
 * Validation cho thay doi role
*/
const updateRoleValidation = [
  body('role_id')
    .notEmpty()
    .withMessage('Role la bat buoc')
    .isInt({ min: 1 })
    .withMessage('Role khong hop le'),
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  updateRoleValidation,
  updateStatusValidation,
  resetPasswordValidation,
  idParamValidation,
  queryValidation,
};
