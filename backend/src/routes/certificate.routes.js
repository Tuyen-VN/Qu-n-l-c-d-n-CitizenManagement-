const express = require('express');
const router = express.Router();
const { birthCertController, deathCertController } = require('../controllers/certificate.controller');
const { verifyToken, verifyRole, verifyWardAccess } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { logAudit } = require('../middleware/audit.middleware');
const {
  createBirthCertValidation,
  updateBirthCertValidation,
  createDeathCertValidation,
  updateDeathCertValidation,
  idParamValidation,
  certNumberParamValidation,
  queryValidation,
  statsQueryValidation,
} = require('../validators/certificate.validator');

// ==================== BIRTH CERTIFICATE ROUTES ====================

/**
 * @swagger
 * /api/birth-certificates:
 *   get:
 *     summary: Lay danh sach giay khai sinh
 *     tags: [Birth Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/birth-certificates',
  verifyToken,
  verifyWardAccess,
  queryValidation,
  validate,
  birthCertController.getBirthCertificates
);

/**
 * @swagger
 * /api/birth-certificates/stats:
 *   get:
 *     summary: Thong ke khai sinh theo thang/nam
 *     tags: [Birth Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/birth-certificates/stats',
  verifyToken,
  verifyWardAccess,
  statsQueryValidation,
  validate,
  birthCertController.getBirthStats
);

/**
 * @swagger
 * /api/birth-certificates/number/{certNumber}:
 *   get:
 *     summary: Tim giay khai sinh theo so
 *     tags: [Birth Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/birth-certificates/number/:certNumber',
  verifyToken,
  verifyWardAccess,
  certNumberParamValidation,
  validate,
  birthCertController.getBirthCertificateByNumber
);

/**
 * @swagger
 * /api/birth-certificates/{id}:
 *   get:
 *     summary: Lay chi tiet giay khai sinh
 *     tags: [Birth Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/birth-certificates/:id',
  verifyToken,
  verifyWardAccess,
  idParamValidation,
  validate,
  birthCertController.getBirthCertificateById
);

/**
 * @swagger
 * /api/birth-certificates:
 *   post:
 *     summary: Cap giay khai sinh
 *     tags: [Birth Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - child_citizen_id
 *             properties:
 *               child_citizen_id:
 *                 type: integer
 *               father_citizen_id:
 *                 type: integer
 *               mother_citizen_id:
 *                 type: integer
 *               birth_place:
 *                 type: string
 *               registrar_name:
 *                 type: string
 *               notes:
 *                 type: string
 */
router.post(
  '/birth-certificates',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  createBirthCertValidation,
  validate,
  logAudit('CREATE', 'BirthCertificates'),
  birthCertController.createBirthCertificate
);

/**
 * @swagger
 * /api/birth-certificates/{id}:
 *   put:
 *     summary: Cap nhat giay khai sinh
 *     tags: [Birth Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/birth-certificates/:id',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  updateBirthCertValidation,
  validate,
  logAudit('UPDATE', 'BirthCertificates'),
  birthCertController.updateBirthCertificate
);

/**
 * @swagger
 * /api/birth-certificates/{id}:
 *   delete:
 *     summary: Xoa giay khai sinh
 *     tags: [Birth Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/birth-certificates/:id',
  verifyToken,
  verifyRole(['Admin']),
  idParamValidation,
  validate,
  logAudit('DELETE', 'BirthCertificates'),
  birthCertController.deleteBirthCertificate
);

// ==================== DEATH CERTIFICATE ROUTES ====================

/**
 * @swagger
 * /api/death-certificates:
 *   get:
 *     summary: Lay danh sach giay khai tu
 *     tags: [Death Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/death-certificates',
  verifyToken,
  verifyWardAccess,
  queryValidation,
  validate,
  deathCertController.getDeathCertificates
);

/**
 * @swagger
 * /api/death-certificates/stats:
 *   get:
 *     summary: Thong ke khai tu theo thang/nam
 *     tags: [Death Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/death-certificates/stats',
  verifyToken,
  verifyWardAccess,
  statsQueryValidation,
  validate,
  deathCertController.getDeathStats
);

/**
 * @swagger
 * /api/death-certificates/number/{certNumber}:
 *   get:
 *     summary: Tim giay khai tu theo so
 *     tags: [Death Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/death-certificates/number/:certNumber',
  verifyToken,
  verifyWardAccess,
  certNumberParamValidation,
  validate,
  deathCertController.getDeathCertificateByNumber
);

/**
 * @swagger
 * /api/death-certificates/{id}:
 *   get:
 *     summary: Lay chi tiet giay khai tu
 *     tags: [Death Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/death-certificates/:id',
  verifyToken,
  verifyWardAccess,
  idParamValidation,
  validate,
  deathCertController.getDeathCertificateById
);

/**
 * @swagger
 * /api/death-certificates:
 *   post:
 *     summary: Cap giay khai tu
 *     tags: [Death Certificates]
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
 *               - date_of_death
 *             properties:
 *               citizen_id:
 *                 type: integer
 *               date_of_death:
 *                 type: string
 *                 format: date
 *               place_of_death:
 *                 type: string
 *               cause_of_death:
 *                 type: string
 *               burial_place:
 *                 type: string
 *               registrar_name:
 *                 type: string
 *               notes:
 *                 type: string
 */
router.post(
  '/death-certificates',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  createDeathCertValidation,
  validate,
  logAudit('CREATE', 'DeathCertificates'),
  deathCertController.createDeathCertificate
);

/**
 * @swagger
 * /api/death-certificates/{id}:
 *   put:
 *     summary: Cap nhat giay khai tu
 *     tags: [Death Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/death-certificates/:id',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  updateDeathCertValidation,
  validate,
  logAudit('UPDATE', 'DeathCertificates'),
  deathCertController.updateDeathCertificate
);

/**
 * @swagger
 * /api/death-certificates/{id}:
 *   delete:
 *     summary: Xoa giay khai tu
 *     tags: [Death Certificates]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/death-certificates/:id',
  verifyToken,
  verifyRole(['Admin']),
  idParamValidation,
  validate,
  logAudit('DELETE', 'DeathCertificates'),
  deathCertController.deleteDeathCertificate
);

module.exports = router;