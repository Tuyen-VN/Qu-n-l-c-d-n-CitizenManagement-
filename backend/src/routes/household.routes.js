const express = require('express');
const router = express.Router();
const householdController = require('../controllers/household.controller');
const { verifyToken, verifyRole, verifyWardAccess } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { logAudit } = require('../middleware/audit.middleware');
const {
  createHouseholdValidation,
  updateHouseholdValidation,
  addMemberValidation,
  changeHeadValidation,
  transferHouseholdValidation,
  idParamValidation,
  citizenIdParamValidation,
  queryValidation,
} = require('../validators/household.validator');

/**
 * @swagger
 * /api/households:
 *   get:
 *     summary: Lay danh sach ho khau
 *     tags: [Households]
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
 *         name: minMembers
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxMembers
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thanh cong
 */
router.get(
  '/',
  verifyToken,
  verifyWardAccess,
  queryValidation,
  validate,
  householdController.getHouseholds
);

/**
 * @swagger
 * /api/households/{id}:
 *   get:
 *     summary: Lay thong tin chi tiet ho khau
 *     tags: [Households]
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
 */
router.get(
  '/:id',
  verifyToken,
  verifyWardAccess,
  idParamValidation,
  validate,
  householdController.getHouseholdById
);

/**
 * @swagger
 * /api/households:
 *   post:
 *     summary: Tao ho khau moi
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - head_of_household_id
 *               - address
 *               - ward_id
 *             properties:
 *               head_of_household_id:
 *                 type: integer
 *               address:
 *                 type: string
 *               ward_id:
 *                 type: integer
 *               household_type:
 *                 type: string
 *                 enum: [Thuong tru, Tap the]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tao thanh cong
 */
router.post(
  '/',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  createHouseholdValidation,
  validate,
  logAudit('CREATE', 'Households'),
  householdController.createHousehold
);

/**
 * @swagger
 * /api/households/{id}:
 *   put:
 *     summary: Cap nhat thong tin ho khau
 *     tags: [Households]
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
 *               address:
 *                 type: string
 *               household_type:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cap nhat thanh cong
 */
router.put(
  '/:id',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  updateHouseholdValidation,
  validate,
  logAudit('UPDATE', 'Households'),
  householdController.updateHousehold
);

/**
 * @swagger
 * /api/households/{id}:
 *   delete:
 *     summary: Xoa ho khau
 *     tags: [Households]
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
 */
router.delete(
  '/:id',
  verifyToken,
  verifyRole(['Admin']),
  idParamValidation,
  validate,
  logAudit('DELETE', 'Households'),
  householdController.deleteHousehold
);

/**
 * @swagger
 * /api/households/{id}/members:
 *   get:
 *     summary: Lay danh sach thanh vien ho khau
 *     tags: [Households]
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
 */
router.get(
  '/:id/members',
  verifyToken,
  verifyWardAccess,
  idParamValidation,
  validate,
  householdController.getHouseholdMembers
);

/**
 * @swagger
 * /api/households/{id}/members:
 *   post:
 *     summary: Them thanh vien vao ho khau
 *     tags: [Households]
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
 *               - citizen_id
 *               - relationship_to_head
 *             properties:
 *               citizen_id:
 *                 type: integer
 *               relationship_to_head:
 *                 type: string
 *     responses:
 *       201:
 *         description: Them thanh cong
 */
router.post(
  '/:id/members',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  addMemberValidation,
  validate,
  logAudit('CREATE', 'HouseholdMembers'),
  householdController.addHouseholdMember
);

/**
 * @swagger
 * /api/households/{id}/members/{citizenId}:
 *   delete:
 *     summary: Xoa thanh vien khoi ho khau
 *     tags: [Households]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: citizenId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xoa thanh cong
 */
router.delete(
  '/:id/members/:citizenId',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  citizenIdParamValidation,
  validate,
  logAudit('DELETE', 'HouseholdMembers'),
  householdController.removeHouseholdMember
);

/**
 * @swagger
 * /api/households/{id}/head:
 *   put:
 *     summary: Doi chu ho
 *     tags: [Households]
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
 *               - new_head_citizen_id
 *             properties:
 *               new_head_citizen_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Doi chu ho thanh cong
 */
router.put(
  '/:id/head',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  changeHeadValidation,
  validate,
  logAudit('UPDATE', 'Households'),
  householdController.changeHeadOfHousehold
);

/**
 * @swagger
 * /api/households/{id}/transfer:
 *   post:
 *     summary: Chuyen ho khau (thay doi dia chi thuong tru)
 *     tags: [Households]
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
 *               - new_address
 *               - new_ward_id
 *             properties:
 *               new_address:
 *                 type: string
 *               new_ward_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Chuyen ho khau thanh cong
 */
router.post(
  '/:id/transfer',
  verifyToken,
  verifyRole(['Admin', 'Staff']),
  verifyWardAccess,
  idParamValidation,
  transferHouseholdValidation,
  validate,
  logAudit('UPDATE', 'Households'),
  householdController.transferHousehold
);

module.exports = router;