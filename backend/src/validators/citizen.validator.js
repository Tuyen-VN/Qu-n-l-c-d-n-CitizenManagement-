const { body, param, query } = require('express-validator');

/**
 * Validation cho tao cong dan moi
 */
const createCitizenValidation = [
  body('citizen_code')
    .trim()
    .notEmpty()
    .withMessage('CCCD/CMND la bat buoc')
    .isLength({ min: 9, max: 12 })
    .withMessage('CCCD/CMND phai co tu 9-12 ky tu')
    .isNumeric()
    .withMessage('CCCD/CMND chi duoc chua so'),

  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Ho va ten la bat buoc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Ho va ten phai co tu 2-100 ky tu'),

  body('date_of_birth')
    .notEmpty()
    .withMessage('Ngay sinh la bat buoc')
    .isDate()
    .withMessage('Ngay sinh khong hop le')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate >= today) {
        throw new Error('Ngay sinh phai truoc ngay hom nay');
      }
      return true;
    }),

  body('gender')
    .notEmpty()
    .withMessage('Gioi tinh la bat buoc')
    .isIn(['Nam', 'Nữ', 'Khác'])
    .withMessage('Gioi tinh khong hop le'),

  body('ethnicity')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Dan toc toi da 50 ky tu'),

  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('So dien thoai khong hop le (10-11 chu so)'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email khong hop le'),

  body('permanent_address')
    .trim()
    .notEmpty()
    .withMessage('Dia chi thuong tru la bat buoc')
    .isLength({ max: 255 })
    .withMessage('Dia chi thuong tru toi da 255 ky tu'),

  body('ward_id')
    .notEmpty()
    .withMessage('Phuong/xa la bat buoc')
    .isInt({ min: 1 })
    .withMessage('Phuong/xa khong hop le'),
];

/**
 * Validation cho cap nhat cong dan
 */
const updateCitizenValidation = [
  body('citizen_code')
    .optional()
    .trim()
    .isLength({ min: 9, max: 12 })
    .withMessage('CCCD/CMND phai co tu 9-12 ky tu')
    .isNumeric()
    .withMessage('CCCD/CMND chi duoc chua so'),

  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ho va ten phai co tu 2-100 ky tu'),

  body('date_of_birth')
    .optional()
    .isDate()
    .withMessage('Ngay sinh khong hop le'),

  body('gender')
    .optional()
    .isIn(['Nam', 'Nữ', 'Khác'])
    .withMessage('Gioi tinh khong hop le'),

  body('phone')
    .optional()
    .matches(/^[0-9]{10,11}$/)
    .withMessage('So dien thoai khong hop le'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email khong hop le'),
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

  query('gender')
    .optional()
    .isIn(['Nam', 'Nữ', 'Khác'])
    .withMessage('Gioi tinh khong hop le'),

  query('wardId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ward ID khong hop le'),
];

module.exports = {
  createCitizenValidation,
  updateCitizenValidation,
  idParamValidation,
  queryValidation,
};