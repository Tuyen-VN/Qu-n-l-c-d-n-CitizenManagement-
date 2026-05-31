const express = require("express");
const router = express.Router();
const wardController = require("../controllers/ward.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const { idParamValidation } = require("../validators/citizen.validator");

/**
 * @swagger
 * /api/wards:
 *   get:
 *     summary: Lay danh sach tat ca phuong/xa
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lay danh sach phuong/xa thanh cong"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ward_id:
 *                         type: integer
 *                         example: 1
 *                       ward_code:
 *                         type: string
 *                         example: "HN-BA-01"
 *                       ward_name:
 *                         type: string
 *                         example: "Phuong Dien Bien"
 *                       district_id:
 *                         type: integer
 *                         example: 1
 *                       district_name:
 *                         type: string
 *                         example: "Ba Dinh"
 *                       district_code:
 *                         type: string
 *                         example: "HN-BA"
 *                       province_id:
 *                         type: integer
 *                         example: 1
 *                       province_name:
 *                         type: string
 *                         example: "Ha Noi"
 *                       province_code:
 *                         type: string
 *                         example: "HN"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Chua dang nhap
 *       500:
 *         description: Loi server
 */
router.get("/", verifyToken, wardController.getAllWards);

/**
 * @swagger
 * /api/wards/district/{districtId}:
 *   get:
 *     summary: Lay danh sach phuong/xa theo quan/huyen
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: districtId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID quan/huyen
 *     responses:
 *       200:
 *         description: Thanh cong
 *       401:
 *         description: Chua dang nhap
 *       500:
 *         description: Loi server
 */
router.get(
  "/district/:districtId",
  verifyToken,
  idParamValidation,
  validate,
  wardController.getWardsByDistrict
);

/**
 * @swagger
 * /api/wards/{id}:
 *   get:
 *     summary: Lay thong tin chi tiet phuong/xa
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID phuong/xa
 *     responses:
 *       200:
 *         description: Thanh cong
 *       404:
 *         description: Khong tim thay phuong/xa
 *       401:
 *         description: Chua dang nhap
 *       500:
 *         description: Loi server
 */
router.get(
  "/:id",
  verifyToken,
  idParamValidation,
  validate,
  wardController.getWardById
);

module.exports = router;
