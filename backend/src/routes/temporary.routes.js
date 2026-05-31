const express = require('express');
const router = express.Router();
const { tempResidenceController, tempAbsenceController } = require('../controllers/temporary.controller');
const { verifyToken, verifyRole, verifyWardAccess } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { logAudit } = require('../middleware/audit.middleware');
const {
  createTempResidenceValidation,
  updateTempResidenceValidation,
  extendTempResidenceValidation,
  createTempAbsenceValidation,
  updateTempAbsenceValidation,
  extendTempAbsenceValidation,
  markReturnedValidation,
  idParamValidation,
  queryValidation,
} = require('../validators/temporary.validator');

/**
 * @swagger
 * /api/temporary-residences:
 *   get:
 *     summary: Lay danh sach dang ky tam tru
 *     tags: [Temporary Residences]
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
 *         description: Tim kiem theo ten, CCCD, dia chi
 *       - in: query
 *         name: wardId
 *         schema:
 *           type: integer
 *         description: Loc theo phuong/xa
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Expired, Cancelled]
 *         description: Loc theo trang thai
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.get(
  '/temporary-residences',
  verifyToken,
  verifyWardAccess,
  queryValidation,
  validate,
  tempResidenceController.getTemporaryResidences
);

/**
 * @swagger
 * /api/temporary-residences/expiring:
 *   get:
 *     summary: Lay danh sach tam tru sap het han
 *     tags: [Temporary Residences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: So ngay truoc khi het han
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
  '/temporary-residences/expiring',
  verifyToken,
  verifyWardAccess,
  tempResidenceController.getExpiringResidences
);

/**
 * @swagger
 * /api/temporary-residences/stats:
 *   get:
 *     summary: Thong ke tam tru
 *     tags: [Temporary Residences]
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
  '/temporary-residences/stats',
  verifyToken,
  verifyWardAccess,
  tempResidenceController.getResidenceStats
);

/**
 * @swagger
 * /api/temporary-residences/{id}:
 *   get:
 *     summary: Lay chi tiet dang ky tam tru
 *     tags: [Temporary Residences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID dang ky tam tru
 *     responses:
 *       200:
 *         description: Thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.get(
  '/temporary-residences/:id',
  verifyToken,
  verifyWardAccess,
  idParamValidation,
  validate,
  tempResidenceController.getTemporaryResidenceById
);

/**
 * @swagger
 * /api/temporary-residences:
 *   post:
 *     summary: Dang ky tam tru
 *     tags: [Temporary Residences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - citizen_id
 *               - temporary_address
 *               - ward_id
 *               - start_date
 *               - end_date
 *             properties:
 *               citizen_id:
 *                 type: integer
 *                 description: ID cong dan
 *               temporary_address:
 *                 type: string
 *                 description: Dia chi tam tru
 *               ward_id:
 *                 type: integer
 *                 description: ID phuong/xa tam tru
 *               reason:
 *                 type: string
 *                 description: Ly do tam tru
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Ngay bat dau
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Ngay ket thuc (toi da 12 thang)
 *               notes:
 *                 type: string
 *                 description: Ghi chu
 *     responses:
 *       201:
 *         description: Dang ky thanh cong
 *       400:
 *         description: Du lieu khong hop le
 *       409:
 *         description: Da co dang ky tam tru hoat dong
 */
router.post(
  '/temporary-residences',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  createTempResidenceValidation,
  validate,
  logAudit('CREATE', 'TemporaryResidences'),
  tempResidenceController.createTemporaryResidence
);

/**
 * @swagger
 * /api/temporary-residences/{id}:
 *   put:
 *     summary: Cap nhat thong tin tam tru
 *     tags: [Temporary Residences]
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
 *               temporary_address:
 *                 type: string
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cap nhat thanh cong
 */
router.put(
  '/temporary-residences/:id',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  updateTempResidenceValidation,
  validate,
  logAudit('UPDATE', 'TemporaryResidences'),
  tempResidenceController.updateTemporaryResidence
);

/**
 * @swagger
 * /api/temporary-residences/{id}/extend:
 *   put:
 *     summary: Gia han tam tru
 *     tags: [Temporary Residences]
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
 *               - new_end_date
 *             properties:
 *               new_end_date:
 *                 type: string
 *                 format: date
 *                 description: Ngay ket thuc moi (tong thoi gian khong qua 12 thang)
 *     responses:
 *       200:
 *         description: Gia han thanh cong
 *       400:
 *         description: Ngay khong hop le hoac qua 12 thang
 */
router.put(
  '/temporary-residences/:id/extend',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  extendTempResidenceValidation,
  validate,
  logAudit('UPDATE', 'TemporaryResidences'),
  tempResidenceController.extendTemporaryResidence
);

/**
 * @swagger
 * /api/temporary-residences/{id}/cancel:
 *   put:
 *     summary: Huy dang ky tam tru
 *     tags: [Temporary Residences]
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
 *         description: Huy thanh cong
 *       400:
 *         description: Chi duoc huy dang ky dang hoat dong
 */
router.put(
  '/temporary-residences/:id/cancel',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  validate,
  logAudit('UPDATE', 'TemporaryResidences'),
  tempResidenceController.cancelTemporaryResidence
);

// ==================== TEMPORARY ABSENCE ROUTES ====================

/**
 * @swagger
 * /api/temporary-absences:
 *   get:
 *     summary: Lay danh sach dang ky tam vang
 *     tags: [Temporary Absences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *       - in: query
 *         name: wardId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Extended, Returned]
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.get(
  '/temporary-absences',
  verifyToken,
  verifyWardAccess,
  queryValidation,
  validate,
  tempAbsenceController.getTemporaryAbsences
);

/**
 * @swagger
 * /api/temporary-absences/expiring:
 *   get:
 *     summary: Lay danh sach tam vang sap het han (sap ve)
 *     tags: [Temporary Absences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: wardId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.get(
  '/temporary-absences/expiring',
  verifyToken,
  verifyWardAccess,
  tempAbsenceController.getExpiringAbsences
);

/**
 * @swagger
 * /api/temporary-absences/stats:
 *   get:
 *     summary: Thong ke tam vang
 *     tags: [Temporary Absences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: wardId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.get(
  '/temporary-absences/stats',
  verifyToken,
  verifyWardAccess,
  tempAbsenceController.getAbsenceStats
);

/**
 * @swagger
 * /api/temporary-absences/{id}:
 *   get:
 *     summary: Lay chi tiet dang ky tam vang
 *     tags: [Temporary Absences]
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
 *         description: Thanh cong
 *       404:
 *         description: Khong tim thay
 */
router.get(
  '/temporary-absences/:id',
  verifyToken,
  verifyWardAccess,
  idParamValidation,
  validate,
  tempAbsenceController.getTemporaryAbsenceById
);

/**
 * @swagger
 * /api/temporary-absences:
 *   post:
 *     summary: Dang ky tam vang
 *     tags: [Temporary Absences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - citizen_id
 *               - destination_address
 *               - start_date
 *               - expected_return_date
 *             properties:
 *               citizen_id:
 *                 type: integer
 *               destination_address:
 *                 type: string
 *                 description: Dia chi noi den
 *               destination_ward_code:
 *                 type: string
 *                 description: Ma phuong/xa noi den (neu co)
 *               reason:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               expected_return_date:
 *                 type: string
 *                 format: date
 *                 description: Ngay du kien ve (toi da 12 thang)
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Dang ky thanh cong
 */
router.post(
  '/temporary-absences',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  createTempAbsenceValidation,
  validate,
  logAudit('CREATE', 'TemporaryAbsences'),
  tempAbsenceController.createTemporaryAbsence
);

/**
 * @swagger
 * /api/temporary-absences/{id}:
 *   put:
 *     summary: Cap nhat thong tin tam vang
 *     tags: [Temporary Absences]
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
 *               destination_address:
 *                 type: string
 *               destination_ward_code:
 *                 type: string
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cap nhat thanh cong
 */
router.put(
  '/temporary-absences/:id',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  updateTempAbsenceValidation,
  validate,
  logAudit('UPDATE', 'TemporaryAbsences'),
  tempAbsenceController.updateTemporaryAbsence
);

/**
 * @swagger
 * /api/temporary-absences/{id}/extend:
 *   put:
 *     summary: Gia han tam vang
 *     tags: [Temporary Absences]
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
 *               - new_expected_return_date
 *             properties:
 *               new_expected_return_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Gia han thanh cong (status chuyen thanh Extended)
 */
router.put(
  '/temporary-absences/:id/extend',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  extendTempAbsenceValidation,
  validate,
  logAudit('UPDATE', 'TemporaryAbsences'),
  tempAbsenceController.extendTemporaryAbsence
);

/**
 * @swagger
 * /api/temporary-absences/{id}/return:
 *   put:
 *     summary: Danh dau cong dan da ve
 *     tags: [Temporary Absences]
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
 *               actual_return_date:
 *                 type: string
 *                 format: date
 *                 description: Ngay ve thuc te (neu khong truyen, lay ngay hom nay)
 *     responses:
 *       200:
 *         description: Danh dau thanh cong (status chuyen thanh Returned)
 */
router.put(
  '/temporary-absences/:id/return',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  markReturnedValidation,
  validate,
  logAudit('UPDATE', 'TemporaryAbsences'),
  tempAbsenceController.markAsReturned
);

module.exports = router;