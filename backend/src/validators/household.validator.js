const { body, param, query } = require('express-validator');

/**
 * Validation cho tao ho khau moi
 */
const createHouseholdValidation = [
  body('head_of_household_id')
    .notEmpty()
    .withMessage('CHủ hộ là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('Chủ hộ không hợp lệ'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Địa chỉ là bắt buộc')
    .isLength({ max: 255 })
    .withMessage('Địa chỉ tối đa 255 ký tự'),

  body('ward_id')
    .notEmpty()
    .withMessage('Phường/xã là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('Phường/xã không hợp lệ'),

  body('household_type')
    .optional()
    .isIn(['Thường trú', 'Tạm trú'])
    .withMessage('Loại hộ khẩu không hợp lệ'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú tối đa 500 ký tự'),
];

/**
 * Validation cho cap nhat ho khau
 */
const updateHouseholdValidation = [
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Địa chỉ không được rỗng')
    .isLength({ max: 255 })
    .withMessage('Địa chỉ tối đa 255 ký tự'),

  body('household_type')
    .optional()
    .isIn(['Thường trú', 'Tạm trú'])
    .withMessage('Loại hộ khẩu không hợp lệ'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú tối đa 500 ký tự'),
];

/**
 * Validation cho them thanh vien
 */
const addMemberValidation = [
  body('citizen_id')
    .notEmpty()
    .withMessage('ID công dân là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('ID công dân không hợp lệ'),

  body('relationship_to_head')
    .trim()
    .notEmpty()
    .withMessage('Quan hệ với chủ hộ là bắt buộc')
    .isLength({ max: 50 })
    .withMessage('Quan hệ tối đa 50 ký tự'),
];

/**
 * Validation cho doi chu ho
 */
const changeHeadValidation = [
  body('new_head_citizen_id')
    .notEmpty()
    .withMessage('ID chủ hộ mới là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('ID chủ hộ mới không hợp lệ'),
];

/**
 * Validation cho chuyen ho khau
 */
const transferHouseholdValidation = [
  body('new_address')
    .trim()
    .notEmpty()
    .withMessage('Địa chỉ mới là bắt buộc')
    .isLength({ max: 255 })
    .withMessage('Địa chỉ tối đa 255 ký tự'),

  body('new_ward_id')
    .notEmpty()
    .withMessage('Phường/xã mới là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('Phường/xã mới không hợp lệ'),
];

/**
 * Validation cho ID param
 */
const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID không hợp lệ'),
];

/**
 * Validation cho citizenId param
 */
const citizenIdParamValidation = [
  param('citizenId')
    .isInt({ min: 1 })
    .withMessage('Citizen ID không hợp lệ'),
];

/**
 * Validation cho query params
 */
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Kích thước trang phải từ 1-100'),

  query('wardId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ward ID không hợp lệ'),

  query('minMembers')
    .optional()
    .isInt({ min: 1, max: 15 })
    .withMessage('Số thành viên tối thiểu phải từ 1-15'),

  query('maxMembers')
    .optional()
    .isInt({ min: 1, max: 15 })
    .withMessage('Số thành viên tối đa phải từ 1-15'),
];

module.exports = {
  createHouseholdValidation,
  updateHouseholdValidation,
  addMemberValidation,
  changeHeadValidation,
  transferHouseholdValidation,
  idParamValidation,
  citizenIdParamValidation,
  queryValidation,
};