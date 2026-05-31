const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizen.controller');
const { verifyToken, verifyRole, verifyWardAccess } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  createCitizenValidation,
  updateCitizenValidation,
  idParamValidation,
  queryValidation,
} = require('../validators/citizen.validator');

/**
 * @swagger
 * /api/citizens:
 *   get:
 *     summary: Lay danh sach cong dan
 *     tags: [Citizens]
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
 *         description: Tim kiem theo ten hoac CCCD
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [Male, Female, Other]
 *         description: Loc theo gioi tinh
 *       - in: query
 *         name: wardId
 *         schema:
 *           type: integer
 *         description: Loc theo phuong/xa
 *     responses:
 *       200:
 *         description: Thanh cong
 *       401:
 *         description: Chua dang nhap
 */
router.get(
  '/',
  verifyToken,
  verifyWardAccess,
  queryValidation,
  validate,
  citizenController.getCitizens
);

/**
 * @swagger
 * /api/citizens/stats/gender:
 *   get:
 *     summary: Thong ke cong dan theo gioi tinh
 *     tags: [Citizens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: wardId
 *         schema:
 *           type: integer
 *         description: Loc theo phuong/xa
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.get(
  '/stats/gender',
  verifyToken,
  verifyWardAccess,
  citizenController.getStatsByGender
);

/**
 * @swagger
 * /api/citizens/stats/age-group:
 *   get:
 *     summary: Thong ke cong dan theo do tuoi
 *     tags: [Citizens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: wardId
 *         schema:
 *           type: integer
 *         description: Loc theo phuong/xa
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.get(
  '/stats/age-group',
  verifyToken,
  verifyWardAccess,
  citizenController.getStatsByAgeGroup
);

/**
 * @swagger
 * /api/citizens/{id}:
 *   get:
 *     summary: Lay thong tin chi tiet cong dan
 *     tags: [Citizens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID cong dan
 *     responses:
 *       200:
 *         description: Thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.get(
  '/:id',
  verifyToken,
  verifyWardAccess,
  idParamValidation,
  validate,
  citizenController.getCitizenById
);

/**
 * @swagger
 * components:
 *   schemas:
 *     NewCitizen:
 *       type: object
 *       required:
 *         - citizen_code
 *         - full_name
 *         - date_of_birth
 *         - gender
 *         - permanent_address
 *         - ward_id
 *       properties:
 *         citizen_code:
 *           type: string
 *           example: "012345678"
 *         full_name:
 *           type: string
 *           example: "Nguyễn Văn A"
 *         date_of_birth:
 *           type: string
 *           format: date
 *           example: "1990-01-01"
 *         gender:
 *           type: string
 *           example: "Male"
 *         permanent_address:
 *           type: string
 *           example: "123 Lê Lợi, Phường 1"
 *         ward_id:
 *           type: integer
 *           example: 1
 *         phone:
 *           type: string
 *           example: "0912345678"
 *         email:
 *           type: string
 *           example: "nvA@example.com"
 */
/**

/**
 * @swagger
 * /api/citizens:
 *   post:
 *     summary: Them cong dan moi
 *     tags: [Citizens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewCitizen'
 *     responses:
 *       201:
 *         description: Them thanh cong
 *       400:
 *         description: Du lieu khong hop le
 *       409:
 *         description: CCCD da ton tai
 */
router.post(
  '/',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  createCitizenValidation,
  validate,
  citizenController.createCitizen
);

/**
 * @swagger
 * /api/citizens/{id}:
 *   put:
 *     summary: Cap nhat thong tin cong dan
 *     tags: [Citizens]
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
 *         description: Cap nhat thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.put(
  '/:id',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  updateCitizenValidation,
  validate,
  citizenController.updateCitizen
);

/**
 * @swagger
 * /api/citizens/{id}:
 *   delete:
 *     summary: Xoa cong dan (soft delete)
 *     tags: [Citizens]
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
 */
router.delete(
  '/:id',
  verifyToken,
  verifyRole(['Admin']),
  idParamValidation,
  validate,
  citizenController.deleteCitizen
);

module.exports = router;