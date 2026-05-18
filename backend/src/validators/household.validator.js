const { body, param, query } = require('express-validator');

/**
 * Validation cho tao ho khau moi
 */
const createHouseholdValidation = [
  body('head_of_household_id')
    .notEmpty()
    .withMessage('Chu ho la bat buoc')
    .isInt({ min: 1 })
    .withMessage('Chu ho khong hop le'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Dia chi la bat buoc')
    .isLength({ max: 255 })
    .withMessage('Dia chi toi da 255 ky tu'),

  body('ward_id')
    .notEmpty()
    .withMessage('Phuong/xa la bat buoc')
    .isInt({ min: 1 })
    .withMessage('Phuong/xa khong hop le'),

  body('household_type')
    .optional()
    .isIn(['Thường trú', 'Tạm trú'])
    .withMessage('Loai ho khau khong hop le'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chu toi da 500 ky tu'),
];

/**
 * Validation cho cap nhat ho khau
 */
const updateHouseholdValidation = [
  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Dia chi khong duoc rong')
    .isLength({ max: 255 })
    .withMessage('Dia chi toi da 255 ky tu'),

  body('household_type')
    .optional()
    .isIn(['Thường trú', 'Tạm trú'])
    .withMessage('Loai ho khau khong hop le'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chu toi da 500 ky tu'),
];

/**
 * Validation cho them thanh vien
 */
const addMemberValidation = [
  body('citizen_id')
    .notEmpty()
    .withMessage('ID cong dan la bat buoc')
    .isInt({ min: 1 })
    .withMessage('ID cong dan khong hop le'),

  body('relationship_to_head')
    .trim()
    .notEmpty()
    .withMessage('Quan he voi chu ho la bat buoc')
    .isLength({ max: 50 })
    .withMessage('Quan he toi da 50 ky tu'),
];

/**
 * Validation cho doi chu ho
 */
const changeHeadValidation = [
  body('new_head_citizen_id')
    .notEmpty()
    .withMessage('ID chu ho moi la bat buoc')
    .isInt({ min: 1 })
    .withMessage('ID chu ho moi khong hop le'),
];

/**
 * Validation cho chuyen ho khau
 */
const transferHouseholdValidation = [
  body('new_address')
    .trim()
    .notEmpty()
    .withMessage('Dia chi moi la bat buoc')
    .isLength({ max: 255 })
    .withMessage('Dia chi toi da 255 ky tu'),

  body('new_ward_id')
    .notEmpty()
    .withMessage('Phuong/xa moi la bat buoc')
    .isInt({ min: 1 })
    .withMessage('Phuong/xa moi khong hop le'),
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
 * Validation cho citizenId param
 */
const citizenIdParamValidation = [
  param('citizenId')
    .isInt({ min: 1 })
    .withMessage('Citizen ID khong hop le'),
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

  query('wardId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ward ID khong hop le'),

  query('minMembers')
    .optional()
    .isInt({ min: 1, max: 15 })
    .withMessage('So thanh vien toi thieu phai tu 1-15'),

  query('maxMembers')
    .optional()
    .isInt({ min: 1, max: 15 })
    .withMessage('So thanh vien toi da phai tu 1-15'),
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