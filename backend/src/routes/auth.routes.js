const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
} = require('../validators/auth.validator');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Dang nhap he thong
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dang nhap thanh cong
 *       401:
 *         description: Sai ten dang nhap hoac mat khau
 */
router.post('/login', loginValidation, validate, authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Lam moi access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lam moi token thanh cong
 *       401:
 *         description: Refresh token khong hop le
 */
router.post(
  '/refresh',
  refreshTokenValidation,
  validate,
  authController.refreshToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Dang xuat
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dang xuat thanh cong
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Doi mat khau
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doi mat khau thanh cong
 *       400:
 *         description: Mat khau cu khong dung
 */
router.post(
  '/change-password',
  verifyToken,
  changePasswordValidation,
  validate,
  authController.changePassword
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lay thong tin nguoi dung hien tai
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thanh cong
 *       401:
 *         description: Chua dang nhap
 */
router.get('/me', verifyToken, authController.getCurrentUser);

module.exports = router;