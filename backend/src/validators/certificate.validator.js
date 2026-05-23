const { body, param, query } = require('express-validator');

// ==================== BIRTH CERTIFICATE VALIDATORS ====================

const createBirthCertValidation = [
  // ── Thông tin trẻ (nhập trực tiếp, không còn child_citizen_id) ──
  body('child_full_name')
    .notEmpty().withMessage('Ho ten tre la bat buoc')
    .isLength({ max: 100 }).withMessage('Ho ten tre toi da 100 ky tu'),
 
  body('child_dob')
    .notEmpty().withMessage('Ngay sinh cua tre la bat buoc')
    .isDate().withMessage('Ngay sinh khong hop le')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Ngay sinh khong the lon hon ngay hom nay');
      }
      return true;
    }),
 
  body('child_gender')
    .notEmpty().withMessage('Gioi tinh cua tre la bat buoc')
    .isIn(['Male', 'Female']).withMessage('Gioi tinh phai la Male hoac Female'),
 
  // ── Cha mẹ vẫn là optional ──
  body('father_citizen_id')
    .optional()
    .isInt({ min: 1 }).withMessage('ID cha khong hop le'),
 
  body('mother_citizen_id')
    .optional()
    .isInt({ min: 1 }).withMessage('ID me khong hop le'),
 
  body('birth_place')
    .optional()
    .isLength({ max: 255 }).withMessage('Noi sinh toi da 255 ky tu'),
 
  body('registrar_name')
    .optional()
    .isLength({ max: 100 }).withMessage('Ten nguoi dang ky toi da 100 ky tu'),
 
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Ghi chu toi da 500 ky tu'),
];
 
const updateBirthCertValidation = [
  body('birth_place')
    .optional()
    .isLength({ max: 255 }).withMessage('Noi sinh toi da 255 ky tu'),
 
  body('registrar_name')
    .optional()
    .isLength({ max: 100 }).withMessage('Ten nguoi dang ky toi da 100 ky tu'),
 
  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Ghi chu toi da 500 ky tu'),
];

// ==================== DEATH CERTIFICATE VALIDATORS ====================

const createDeathCertValidation = [
  body('citizen_id')
    .notEmpty()
    .withMessage('ID cong dan la bat buoc')
    .isInt({ min: 1 })
    .withMessage('ID cong dan khong hop le'),

  body('date_of_death')
    .notEmpty()
    .withMessage('Ngay tu vong la bat buoc')
    .isDate()
    .withMessage('Ngay tu vong khong hop le')
    .custom((value) => {
      const deathDate = new Date(value);
      const today = new Date();
      if (deathDate > today) {
        throw new Error('Ngay tu vong khong the lon hon ngay hom nay');
      }
      return true;
    }),

  body('place_of_death')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Noi tu vong toi da 255 ky tu'),

  body('cause_of_death')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Nguyen nhan tu vong toi da 255 ky tu'),

  body('burial_place')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Noi chon cat toi da 255 ky tu'),

  body('registrar_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Ten nguoi dang ky toi da 100 ky tu'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chu toi da 500 ky tu'),
];

const updateDeathCertValidation = [
  body('place_of_death')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Noi tu vong toi da 255 ky tu'),

  body('cause_of_death')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Nguyen nhan tu vong toi da 255 ky tu'),

  body('burial_place')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Noi chon cat toi da 255 ky tu'),

  body('registrar_name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Ten nguoi dang ky toi da 100 ky tu'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chu toi da 500 ky tu'),
];

// ==================== COMMON VALIDATORS ====================

const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID khong hop le'),
];

const certNumberParamValidation = [
  param('certNumber')
    .notEmpty()
    .withMessage('So giay chung nhan la bat buoc')
    .matches(/^(KS|KT)-\d{6}-\d{5}$/)
    .withMessage('So giay chung nhan khong hop le'),
];

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

  query('startDate')
    .optional()
    .isDate()
    .withMessage('Ngay bat dau khong hop le'),

  query('endDate')
    .optional()
    .isDate()
    .withMessage('Ngay ket thuc khong hop le'),
];

const statsQueryValidation = [
  query('year')
    .notEmpty()
    .withMessage('Nam la bat buoc')
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Nam khong hop le'),

  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Thang phai tu 1-12'),

  query('wardId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ward ID khong hop le'),
];

module.exports = {
  // Birth certificate validators
  createBirthCertValidation,
  updateBirthCertValidation,

  // Death certificate validators
  createDeathCertValidation,
  updateDeathCertValidation,

  // Common validators
  idParamValidation,
  certNumberParamValidation,
  queryValidation,
  statsQueryValidation,
};