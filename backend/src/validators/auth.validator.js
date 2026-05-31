const { body } = require('express-validator');

/**
 * Validation cho login
 */
const loginValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Ten dang nhap la bat buoc')
    .isLength({ min: 3 })
    .withMessage('Ten dang nhap phai co it nhat 3 ky tu'),

  body('password')
    .notEmpty()
    .withMessage('Mat khau la bat buoc')
    .isLength({ min: 8 })
    .withMessage('Mat khau phai co it nhat 8 ky tu'),
];

/**
 * Validation cho refresh token
 */
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token la bat buoc'),
];

/**
 * Validation cho change password
 */
const changePasswordValidation = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Mat khau cu la bat buoc'),

  body('newPassword')
    .notEmpty()
    .withMessage('Mat khau moi la bat buoc')
    .isLength({ min: 8 })
    .withMessage('Mat khau moi phai co it nhat 8 ky tu')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mat khau moi phai co chu hoa, chu thuong va so'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Xac nhan mat khau la bat buoc')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Mat khau xac nhan khong khop'),
];

module.exports = {
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
};