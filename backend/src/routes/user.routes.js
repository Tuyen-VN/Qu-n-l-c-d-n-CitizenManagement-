const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken, verifyRole } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const { logAudit } = require("../middleware/audit.middleware");
const {
  createUserValidation,
  updateUserValidation,
  updateRoleValidation,
  updateStatusValidation,
  resetPasswordValidation,
  idParamValidation,
  queryValidation,
} = require("../validators/user.validator");

// Tat ca routes chi danh cho Admin
const adminOnly = [verifyToken, verifyRole(["Admin"])];

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lay danh sach nguoi dung
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: So trang
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: So ban ghi moi trang
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Tim kiem theo username, ho ten, email
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: Loc theo role
 *       - in: query
 *         name: wardId
 *         schema:
 *           type: integer
 *         description: Loc theo phuong/xa
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Loc theo trang thai
 *     responses:
 *       200:
 *         description: Thanh cong
 *       401:
 *         description: Chua dang nhap
 *       403:
 *         description: Khong co quyen
 */
router.get(
  "/",
  ...adminOnly,
  queryValidation,
  validate,
  userController.getUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lay thong tin chi tiet nguoi dung
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID nguoi dung
 *     responses:
 *       200:
 *         description: Thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.get(
  "/:id",
  // ...adminOnly,
  idParamValidation,
  validate,
  userController.getUserById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tao nguoi dung moi
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - full_name
 *               - role_id
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               password:
 *                 type: string
 *                 minLength: 8
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               role_id:
 *                 type: integer
 *               ward_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tao thanh cong
 *       400:
 *         description: Du lieu khong hop le
 *       409:
 *         description: Username hoac email da ton tai
 */
router.post(
  "/",
  ...adminOnly,
  createUserValidation,
  validate,
  logAudit("CREATE", "Users"),
  userController.createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cap nhat thong tin nguoi dung
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               ward_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cap nhat thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.put(
  "/:id",
  ...adminOnly,
  idParamValidation,
  updateUserValidation,
  validate,
  logAudit("UPDATE", "Users"),
  userController.updateUser
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Thay doi role cua nguoi dung
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_id
 *             properties:
 *               role_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Thay doi thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.put(
  "/:id/role",
  ...adminOnly,
  idParamValidation,
  updateRoleValidation,
  validate,
  logAudit("UPDATE", "Users"),
  userController.updateUserRole
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   put:
 *     summary: Thay doi trang thai nguoi dung (khoa/mo khoa)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Thay doi thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.put(
  "/:id/status",
  ...adminOnly,
  idParamValidation,
  updateStatusValidation,
  validate,
  logAudit("UPDATE", "Users"),
  userController.updateUserStatus
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xoa nguoi dung
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoa thanh cong
 *       404:
 *         description: Khong tim thay
 *       400:
 *         description: Khong the xoa admin cuoi cung
 */
router.delete(
  "/:id",
  ...adminOnly,
  idParamValidation,
  validate,
  logAudit("DELETE", "Users"),
  userController.deleteUser
);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset mat khau nguoi dung
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Reset thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.post(
  "/:id/reset-password",
  ...adminOnly,
  idParamValidation,
  resetPasswordValidation,
  validate,
  logAudit("UPDATE", "Users"),
  userController.resetUserPassword
);

module.exports = router;
