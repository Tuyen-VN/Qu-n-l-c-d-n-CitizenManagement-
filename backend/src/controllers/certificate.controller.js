const birthCertService = require('../services/birth-certificate.service');
const deathCertService = require('../services/death-certificate.service');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
  paginationResponse,
} = require('../utils/response');
const logger = require('../utils/logger');

// ==================== BIRTH CERTIFICATE CONTROLLER ====================
class BirthCertificateController {
  async getBirthCertificates(req, res) {
    try {
      const { page = 1, pageSize = 20, searchTerm, startDate, endDate } = req.query;

      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const filters = { page, pageSize, searchTerm, wardId, startDate, endDate };
      const result = await birthCertService.getBirthCertificates(filters);

      return paginationResponse(
        res,
        result.data,
        result.page,
        result.pageSize,
        result.totalCount,
        'Lay danh sach giay khai sinh thanh cong'
      );
    } catch (error) {
      logger.error('Get birth certificates controller error:', error);
      return errorResponse(res, 'GET_BIRTH_CERTS_FAILED', 'Lay danh sach that bai', 500);
    }
  }

  async getBirthCertificateById(req, res) {
    try {
      const { id } = req.params;
      const cert = await birthCertService.getBirthCertificateById(id);

      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (cert.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay giay khai sinh');
        }
      }

      return successResponse(res, cert, 'Lay thong tin giay khai sinh thanh cong', 200);
    } catch (error) {
      logger.error('Get birth certificate by id controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'GET_BIRTH_CERT_FAILED', 'Lay thong tin that bai', 500);
    }
  }

  async getBirthCertificateByNumber(req, res) {
    try {
      const { certNumber } = req.params;
      const cert = await birthCertService.getBirthCertificateByNumber(certNumber);

      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (cert.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay giay khai sinh');
        }
      }

      return successResponse(res, cert, 'Lay thong tin giay khai sinh thanh cong', 200);
    } catch (error) {
      logger.error('Get birth certificate by number controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'GET_BIRTH_CERT_FAILED', 'Lay thong tin that bai', 500);
    }
  }

async createBirthCertificate(req, res) {
  try {
    const certData = req.body;
 
    // Staff dùng wardId được gán; Admin có thể truyền wardId trong body
    const wardId = req.allowedWardId || certData.wardId || null;
 
    const cert = await birthCertService.createBirthCertificate(certData, req.user.userId, wardId);
 
    return successResponse(res, cert, 'Cap giay khai sinh thanh cong', 201);
  } catch (error) {
    logger.error('Create birth certificate controller error:', error);
    if (error.message.includes('da co giay khai sinh')) {
      return conflictResponse(res, error.message);
    }
    if (
      error.message.includes('khong ton tai') ||
      error.message.includes('phai') ||
      error.message.includes('Qua thoi han') ||
      error.message.includes('it nhat')
    ) {
      return errorResponse(res, 'INVALID_DATA', error.message, 400);
    }
    return errorResponse(res, 'CREATE_BIRTH_CERT_FAILED', 'Cap giay khai sinh that bai', 500);
  }
}

  async updateBirthCertificate(req, res) {
    try {
      const { id } = req.params;
      const certData = req.body;

      const cert = await birthCertService.updateBirthCertificate(id, certData);

      return successResponse(res, cert, 'Cap nhat giay khai sinh thanh cong', 200);
    } catch (error) {
      logger.error('Update birth certificate controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'UPDATE_BIRTH_CERT_FAILED', 'Cap nhat that bai', 500);
    }
  }

  async deleteBirthCertificate(req, res) {
    try {
      const { id } = req.params;
      await birthCertService.deleteBirthCertificate(id);

      return successResponse(res, null, 'Xoa giay khai sinh thanh cong', 200);
    } catch (error) {
      logger.error('Delete birth certificate controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'DELETE_BIRTH_CERT_FAILED', 'Xoa that bai', 500);
    }
  }

  async getBirthStats(req, res) {
    try {
      const { year, month } = req.query;

      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const stats = await birthCertService.getStatsByPeriod(
        parseInt(year),
        month ? parseInt(month) : null,
        wardId
      );

      return successResponse(res, stats, 'Lay thong ke khai sinh thanh cong', 200);
    } catch (error) {
      logger.error('Get birth stats controller error:', error);
      return errorResponse(res, 'GET_STATS_FAILED', 'Lay thong ke that bai', 500);
    }
  }
}

// ==================== DEATH CERTIFICATE CONTROLLER ====================
class DeathCertificateController {
  async getDeathCertificates(req, res) {
    try {
      const { page = 1, pageSize = 20, searchTerm, startDate, endDate } = req.query;

      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const filters = { page, pageSize, searchTerm, wardId, startDate, endDate };
      const result = await deathCertService.getDeathCertificates(filters);

      return paginationResponse(
        res,
        result.data,
        result.page,
        result.pageSize,
        result.totalCount,
        'Lay danh sach giay khai tu thanh cong'
      );
    } catch (error) {
      logger.error('Get death certificates controller error:', error);
      return errorResponse(res, 'GET_DEATH_CERTS_FAILED', 'Lay danh sach that bai', 500);
    }
  }

  async getDeathCertificateById(req, res) {
    try {
      const { id } = req.params;
      const cert = await deathCertService.getDeathCertificateById(id);

      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (cert.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay giay khai tu');
        }
      }

      return successResponse(res, cert, 'Lay thong tin giay khai tu thanh cong', 200);
    } catch (error) {
      logger.error('Get death certificate by id controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'GET_DEATH_CERT_FAILED', 'Lay thong tin that bai', 500);
    }
  }

  async getDeathCertificateByNumber(req, res) {
    try {
      const { certNumber } = req.params;
      const cert = await deathCertService.getDeathCertificateByNumber(certNumber);

      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (cert.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay giay khai tu');
        }
      }

      return successResponse(res, cert, 'Lay thong tin giay khai tu thanh cong', 200);
    } catch (error) {
      logger.error('Get death certificate by number controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'GET_DEATH_CERT_FAILED', 'Lay thong tin that bai', 500);
    }
  }

  async createDeathCertificate(req, res) {
    try {
      const certData = req.body;
      const cert = await deathCertService.createDeathCertificate(certData, req.user.userId);

      return successResponse(res, cert, 'Cap giay khai tu thanh cong', 201);
    } catch (error) {
      logger.error('Create death certificate controller error:', error);
      if (error.message.includes('da co giay khai tu')) {
        return conflictResponse(res, error.message);
      }
      if (error.message.includes('khong ton tai') || error.message.includes('khong the') || error.message.includes('da duoc xac nhan')) {
        return errorResponse(res, 'INVALID_DATA', error.message, 400);
      }
      return errorResponse(res, 'CREATE_DEATH_CERT_FAILED', 'Cap giay khai tu that bai', 500);
    }
  }

  async updateDeathCertificate(req, res) {
    try {
      const { id } = req.params;
      const certData = req.body;

      const cert = await deathCertService.updateDeathCertificate(id, certData);

      return successResponse(res, cert, 'Cap nhat giay khai tu thanh cong', 200);
    } catch (error) {
      logger.error('Update death certificate controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'UPDATE_DEATH_CERT_FAILED', 'Cap nhat that bai', 500);
    }
  }

  async deleteDeathCertificate(req, res) {
    try {
      const { id } = req.params;
      await deathCertService.deleteDeathCertificate(id);

      return successResponse(res, null, 'Xoa giay khai tu thanh cong', 200);
    } catch (error) {
      logger.error('Delete death certificate controller error:', error);
      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }
      return errorResponse(res, 'DELETE_DEATH_CERT_FAILED', 'Xoa that bai', 500);
    }
  }

  async getDeathStats(req, res) {
    try {
      const { year, month } = req.query;

      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const stats = await deathCertService.getStatsByPeriod(
        parseInt(year),
        month ? parseInt(month) : null,
        wardId
      );

      return successResponse(res, stats, 'Lay thong ke khai tu thanh cong', 200);
    } catch (error) {
      logger.error('Get death stats controller error:', error);
      return errorResponse(res, 'GET_STATS_FAILED', 'Lay thong ke that bai', 500);
    }
  }
}

module.exports = {
  birthCertController: new BirthCertificateController(),
  deathCertController: new DeathCertificateController(),
};