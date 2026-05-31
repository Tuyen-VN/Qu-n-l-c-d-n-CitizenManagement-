const tempResidenceService = require('../services/temporary-residence.service');
const tempAbsenceService = require('../services/temporary-absence.service');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
  paginationResponse,
} = require('../utils/response');
const logger = require('../utils/logger');

// ==================== TEMPORARY RESIDENCE CONTROLLER ====================
class TemporaryResidenceController {
  async getTemporaryResidences(req, res) {
    try {
      const { page = 1, pageSize = 20, searchTerm, status } = req.query;

      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const filters = { page, pageSize, searchTerm, wardId, status };
      const result = await tempResidenceService.getTemporaryResidences(filters);

      return paginationResponse(
        res,
        result.data,
        result.page,
        result.pageSize,
        result.totalCount,
        'Lay danh sach tam tru thanh cong'
      );
    } catch (error) {
      logger.error('Get temporary residences controller error:', error);
      return errorResponse(res, 'GET_TEMP_RES_FAILED', 'Lay danh sach that bai', 500);
    }
  }

  async getTemporaryResidenceById(req, res) {
    try {
      const { id } = req.params;
      const tempRes = await tempResidenceService.getTemporaryResidenceById(id);

      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (tempRes.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay dang ky tam tru');
        }
      }

      return successResponse(res, tempRes, 'Lay thong tin tam tru thanh cong', 200);
    } catch (error) {
      logger.error('Get temporary residence by id controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'GET_TEMP_RES_FAILED', 'Lay thong tin that bai', 500);
    }
  }

  async createTemporaryResidence(req, res) {
    try {
      const tempResData = req.body;
      const tempRes = await tempResidenceService.createTemporaryResidence(tempResData, req.user.userId);

      return successResponse(res, tempRes, 'Dang ky tam tru thanh cong', 201);
    } catch (error) {
      logger.error('Create temporary residence controller error:', error);
      if (error.message.includes('dang co dang ky')) {
        return conflictResponse(res, error.message);
      }
      if (error.message.includes('khong ton tai') || error.message.includes('phai') || error.message.includes('Thoi han')) {
        return errorResponse(res, 'INVALID_DATA', error.message, 400);
      }
      return errorResponse(res, 'CREATE_TEMP_RES_FAILED', 'Dang ky tam tru that bai', 500);
    }
  }

  async updateTemporaryResidence(req, res) {
    try {
      const { id } = req.params;
      const tempResData = req.body;

      const tempRes = await tempResidenceService.updateTemporaryResidence(id, tempResData);

      return successResponse(res, tempRes, 'Cap nhat tam tru thanh cong', 200);
    } catch (error) {
      logger.error('Update temporary residence controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      if (error.message.includes('Chi duoc')) {
        return errorResponse(res, 'INVALID_STATUS', error.message, 400);
      }
      return errorResponse(res, 'UPDATE_TEMP_RES_FAILED', 'Cap nhat that bai', 500);
    }
  }

  async extendTemporaryResidence(req, res) {
    try {
      const { id } = req.params;
      const { new_end_date } = req.body;

      const tempRes = await tempResidenceService.extendTemporaryResidence(id, new_end_date);

      return successResponse(res, tempRes, 'Gia han tam tru thanh cong', 200);
    } catch (error) {
      logger.error('Extend temporary residence controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      if (error.message.includes('phai sau') || error.message.includes('vuot qua')) {
        return errorResponse(res, 'INVALID_DATE', error.message, 400);
      }
      return errorResponse(res, 'EXTEND_TEMP_RES_FAILED', 'Gia han that bai', 500);
    }
  }

  async cancelTemporaryResidence(req, res) {
    try {
      const { id } = req.params;
      await tempResidenceService.cancelTemporaryResidence(id);

      return successResponse(res, null, 'Huy dang ky tam tru thanh cong', 200);
    } catch (error) {
      logger.error('Cancel temporary residence controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      if (error.message.includes('Chi duoc')) {
        return errorResponse(res, 'INVALID_STATUS', error.message, 400);
      }
      return errorResponse(res, 'CANCEL_TEMP_RES_FAILED', 'Huy dang ky that bai', 500);
    }
  }

  async getExpiringResidences(req, res) {
    try {
      const { days = 30 } = req.query;

      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const residences = await tempResidenceService.getExpiringResidences(parseInt(days), wardId);

      return successResponse(res, residences, 'Lay danh sach tam tru sap het han thanh cong', 200);
    } catch (error) {
      logger.error('Get expiring residences controller error:', error);
      return errorResponse(res, 'GET_EXPIRING_FAILED', 'Lay danh sach that bai', 500);
    }
  }

  async getResidenceStats(req, res) {
    try {
      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const stats = await tempResidenceService.getStats(wardId);

      return successResponse(res, stats, 'Lay thong ke tam tru thanh cong', 200);
    } catch (error) {
      logger.error('Get residence stats controller error:', error);
      return errorResponse(res, 'GET_STATS_FAILED', 'Lay thong ke that bai', 500);
    }
  }
}

// ==================== TEMPORARY ABSENCE CONTROLLER ====================
class TemporaryAbsenceController {
  async getTemporaryAbsences(req, res) {
    try {
      const { page = 1, pageSize = 20, searchTerm, status } = req.query;

      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const filters = { page, pageSize, searchTerm, wardId, status };
      const result = await tempAbsenceService.getTemporaryAbsences(filters);

      return paginationResponse(
        res,
        result.data,
        result.page,
        result.pageSize,
        result.totalCount,
        'Lay danh sach tam vang thanh cong'
      );
    } catch (error) {
      logger.error('Get temporary absences controller error:', error);
      return errorResponse(res, 'GET_TEMP_ABS_FAILED', 'Lay danh sach that bai', 500);
    }
  }

  async getTemporaryAbsenceById(req, res) {
    try {
      const { id } = req.params;
      const tempAbs = await tempAbsenceService.getTemporaryAbsenceById(id);

      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        // Kiem tra citizen thuoc ward cua staff
        const citizenWardId = tempAbs.home_ward_code; // Can map lai neu can
        // Logic kiem tra ward...
      }

      return successResponse(res, tempAbs, 'Lay thong tin tam vang thanh cong', 200);
    } catch (error) {
      logger.error('Get temporary absence by id controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'GET_TEMP_ABS_FAILED', 'Lay thong tin that bai', 500);
    }
  }

  async createTemporaryAbsence(req, res) {
    try {
      const tempAbsData = req.body;
      const tempAbs = await tempAbsenceService.createTemporaryAbsence(tempAbsData, req.user.userId);

      return successResponse(res, tempAbs, 'Dang ky tam vang thanh cong', 201);
    } catch (error) {
      logger.error('Create temporary absence controller error:', error);
      if (error.message.includes('dang co dang ky')) {
        return conflictResponse(res, error.message);
      }
      if (error.message.includes('khong ton tai') || error.message.includes('phai') || error.message.includes('Thoi han')) {
        return errorResponse(res, 'INVALID_DATA', error.message, 400);
      }
      return errorResponse(res, 'CREATE_TEMP_ABS_FAILED', 'Dang ky tam vang that bai', 500);
    }
  }

  async updateTemporaryAbsence(req, res) {
    try {
      const { id } = req.params;
      const tempAbsData = req.body;

      const tempAbs = await tempAbsenceService.updateTemporaryAbsence(id, tempAbsData);

      return successResponse(res, tempAbs, 'Cap nhat tam vang thanh cong', 200);
    } catch (error) {
      logger.error('Update temporary absence controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      if (error.message.includes('Chi duoc')) {
        return errorResponse(res, 'INVALID_STATUS', error.message, 400);
      }
      return errorResponse(res, 'UPDATE_TEMP_ABS_FAILED', 'Cap nhat that bai', 500);
    }
  }

  async extendTemporaryAbsence(req, res) {
    try {
      const { id } = req.params;
      const { new_expected_return_date } = req.body;

      const tempAbs = await tempAbsenceService.extendTemporaryAbsence(id, new_expected_return_date);

      return successResponse(res, tempAbs, 'Gia han tam vang thanh cong', 200);
    } catch (error) {
      logger.error('Extend temporary absence controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      if (error.message.includes('phai sau') || error.message.includes('vuot qua')) {
        return errorResponse(res, 'INVALID_DATE', error.message, 400);
      }
      return errorResponse(res, 'EXTEND_TEMP_ABS_FAILED', 'Gia han that bai', 500);
    }
  }

  async markAsReturned(req, res) {
    try {
      const { id } = req.params;
      const { actual_return_date } = req.body;

      const tempAbs = await tempAbsenceService.markAsReturned(id, actual_return_date);

      return successResponse(res, tempAbs, 'Danh dau da ve thanh cong', 200);
    } catch (error) {
      logger.error('Mark as returned controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      if (error.message.includes('da duoc danh dau') || error.message.includes('khong the')) {
        return errorResponse(res, 'INVALID_ACTION', error.message, 400);
      }
      return errorResponse(res, 'MARK_RETURNED_FAILED', 'Danh dau that bai', 500);
    }
  }

  async getExpiringAbsences(req, res) {
    try {
      const { days = 30 } = req.query;

      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const absences = await tempAbsenceService.getExpiringAbsences(parseInt(days), wardId);

      return successResponse(res, absences, 'Lay danh sach tam vang sap het han thanh cong', 200);
    } catch (error) {
      logger.error('Get expiring absences controller error:', error);
      return errorResponse(res, 'GET_EXPIRING_FAILED', 'Lay danh sach that bai', 500);
    }
  }

  async getAbsenceStats(req, res) {
    try {
      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const stats = await tempAbsenceService.getStats(wardId);

      return successResponse(res, stats, 'Lay thong ke tam vang thanh cong', 200);
    } catch (error) {
      logger.error('Get absence stats controller error:', error);
      return errorResponse(res, 'GET_STATS_FAILED', 'Lay thong ke that bai', 500);
    }
  }
}

module.exports = {
  tempResidenceController: new TemporaryResidenceController(),
  tempAbsenceController: new TemporaryAbsenceController(),
};