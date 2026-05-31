const { body, param, query } = require('express-validator');

// Temporary Residence Validators
const createTempResidenceValidation = [
  body('citizen_id').notEmpty().withMessage('ID cong dan la bat buoc').isInt({ min: 1 }),
  body('temporary_address').trim().notEmpty().withMessage('Dia chi tam tru la bat buoc'),
  body('ward_id').notEmpty().withMessage('Phuong/xa la bat buoc').isInt({ min: 1 }),
  body('start_date').notEmpty().withMessage('Ngay bat dau la bat buoc').isDate(),
  body('end_date').notEmpty().withMessage('Ngay ket thuc la bat buoc').isDate(),
];

const updateTempResidenceValidation = [
  body('temporary_address').optional().trim().notEmpty(),
  body('reason').optional().isLength({ max: 255 }),
  body('notes').optional().isLength({ max: 500 }),
];

const extendTempResidenceValidation = [
  body('new_end_date').notEmpty().withMessage('Ngay ket thuc moi la bat buoc').isDate(),
];

// Temporary Absence Validators
const createTempAbsenceValidation = [
  body('citizen_id').notEmpty().withMessage('ID cong dan la bat buoc').isInt({ min: 1 }),
  body('destination_address').trim().notEmpty().withMessage('Noi den la bat buoc'),
  body('start_date').notEmpty().withMessage('Ngay bat dau la bat buoc').isDate(),
  body('expected_return_date').notEmpty().withMessage('Ngay du kien ve la bat buoc').isDate(),
];

const updateTempAbsenceValidation = [
  body('destination_address').optional().trim().notEmpty(),
  body('destination_ward_code').optional().isLength({ max: 10 }),
  body('reason').optional().isLength({ max: 255 }),
  body('notes').optional().isLength({ max: 500 }),
];

const extendTempAbsenceValidation = [
  body('new_expected_return_date').notEmpty().withMessage('Ngay du kien ve moi la bat buoc').isDate(),
];

const markReturnedValidation = [
  body('actual_return_date').optional().isDate().withMessage('Ngay ve khong hop le'),
];

const idParamValidation = [param('id').isInt({ min: 1 }).withMessage('ID khong hop le')];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  query('wardId').optional().isInt({ min: 1 }),
  query('status').optional().isIn(['Active', 'Expired', 'Cancelled', 'Extended', 'Returned']),
];

module.exports = {
  createTempResidenceValidation,
  updateTempResidenceValidation,
  extendTempResidenceValidation,
  createTempAbsenceValidation,
  updateTempAbsenceValidation,
  extendTempAbsenceValidation,
  markReturnedValidation,
  idParamValidation,
  queryValidation,
};