const citizenService = require('../services/citizen.service');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
  paginationResponse,
} = require('../utils/response');
const logger = require('../utils/logger');

class CitizenController {
  /**
   * @route GET /api/citizens
   * @desc Lay danh sach cong dan
   * @access Private (Admin, Staff, Viewer)
   */
  async getCitizens(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        searchTerm,
        gender,
        minAge,
        maxAge,
        status,
      } = req.query;

      // Neu la Staff, chi lay du lieu cua Ward minh quan ly
      let wardId = req.query.wardId;
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const filters = {
        page,
        pageSize,
        searchTerm,
        wardId,
        gender,
        minAge,
        maxAge,
        status,
      };

      const result = await citizenService.getCitizens(filters);

      // === ĐOẠN THÊM MỚI ĐỂ DỊCH DỮ LIỆU TRẢ VỀ ===
      if (result && result.data) {
        result.data = result.data.map(citizen => {
          if (citizen.gender === 'Male') citizen.gender = 'Nam';
          else if (citizen.gender === 'Female') citizen.gender = 'Nữ';
          else if (citizen.gender === 'Other') citizen.gender = 'Khác';
          return citizen;
        });
      }
      // ============================================

      return paginationResponse(
        res,
        result.data,
        result.page,
        result.pageSize,
        result.totalCount,
        'Lay danh sach cong dan thanh cong'
      );
    } catch (error) {
      logger.error('Get citizens controller error:', error);
      return errorResponse(
        res,
        'GET_CITIZENS_FAILED',
        'Lay danh sach cong dan that bai',
        500
      );
    }
  }

  /**
   * @route GET /api/citizens/:id
   * @desc Lay thong tin chi tiet cong dan
   * @access Private (Admin, Staff, Viewer)
   */
  async getCitizenById(req, res) {
    try {
      const { id } = req.params;
      const citizen = await citizenService.getCitizenById(id);
      
      if (citizen) {
        if (citizen.gender === 'Male') citizen.gender = 'Nam';
        else if (citizen.gender === 'Female') citizen.gender = 'Nữ';
        else if (citizen.gender === 'Other') citizen.gender = 'Khác';
      }

      // Kiem tra quyen truy cap (Staff chi xem duoc citizen trong Ward cua minh)
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (citizen.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay cong dan');
        }
      }

      return successResponse(
        res,
        citizen,
        'Lay thong tin cong dan thanh cong',
        200
      );
    } catch (error) {
      logger.error('Get citizen by id controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      return errorResponse(
        res,
        'GET_CITIZEN_FAILED',
        'Lay thong tin cong dan that bai',
        500
      );
    }
  }

  /**
   * @route POST /api/citizens
   * @desc Them cong dan moi
   * @access Private (Admin, Staff)
   */
  async createCitizen(req, res) {
    try {
      const citizenData = req.body;

      // Chuẩn hóa giới tính: Database yêu cầu (Nam, Nữ, Khác)
      // Thay đổi logic tại hàm createCitizen và updateCitizen:
      if (citizenData.gender) {
        const g = citizenData.gender.toLowerCase().trim();
        if (g === 'nam' || g === 'male') {
          citizenData.gender = 'Male'; // Đẩy chữ tiếng Anh xuống DB cũ của bạn
        } else if (g === 'nữ' || g === 'nu' || g === 'female') {
          citizenData.gender = 'Female'; // Đẩy chữ tiếng Anh xuống DB cũ của bạn
        } else {
          citizenData.gender = 'Other';
        }
      }

      // Neu la Staff, chi duoc tao citizen trong Ward cua minh
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (citizenData.ward_id !== req.allowedWardId) {
          return errorResponse(
            res,
            'FORBIDDEN',
            'Ban chi duoc them cong dan vao phuong/xa ma ban quan ly',
            403
          );
        }
      }

      const citizen = await citizenService.createCitizen(
        citizenData,
        req.user.userId
      );

      return successResponse(
        res,
        citizen,
        'Them cong dan thanh cong',
        201
      );
    } catch (error) {
      logger.error('Create citizen controller error:', error);

      if (error.message.includes('da ton tai')) {
        return conflictResponse(res, error.message);
      }

      return errorResponse(
        res,
        'CREATE_CITIZEN_FAILED',
        'Them cong dan that bai',
        500,
        [{ message: error.message }]  // ← Thêm dòng này
      );
    }
  }

  /**
   * @route PUT /api/citizens/:id
   * @desc Cap nhat thong tin cong dan
   * @access Private (Admin, Staff)
   */
  async updateCitizen(req, res) {
    try {
      const { id } = req.params;
      const citizenData = req.body;

      // Chuẩn hóa giới tính: Database yêu cầu (Nam, Nữ, Khác)
      // Thay đổi logic tại hàm createCitizen và updateCitizen:
      if (citizenData.gender) {
        const g = citizenData.gender.toLowerCase().trim();
        if (g === 'nam' || g === 'male') {
          citizenData.gender = 'Male'; // Đẩy chữ tiếng Anh xuống DB cũ của bạn
        } else if (g === 'nữ' || g === 'nu' || g === 'female') {
          citizenData.gender = 'Female'; // Đẩy chữ tiếng Anh xuống DB cũ của bạn
        } else {
          citizenData.gender = 'Other';
        }
      }

      // Kiem tra quyen truy cap
      const existingCitizen = await citizenService.getCitizenById(id);
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (existingCitizen.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay cong dan');
        }
      }

      const citizen = await citizenService.updateCitizen(id, citizenData);

      return successResponse(
        res,
        citizen,
        'Cap nhat thong tin cong dan thanh cong',
        200
      );
    } catch (error) {
      logger.error('Update citizen controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('da ton tai')) {
        return conflictResponse(res, error.message);
      }

      return errorResponse(
        res,
        'UPDATE_CITIZEN_FAILED',
        'Cap nhat thong tin cong dan that bai',
        500,
        [{ message: error.message }]  // ← Thêm dòng này
      );
    }
  }

  /**
   * @route DELETE /api/citizens/:id
   * @desc Xoa cong dan (soft delete)
   * @access Private (Admin only)
   */
  async deleteCitizen(req, res) {
    try {
      const { id } = req.params;

      await citizenService.deleteCitizen(id);

      return successResponse(res, null, 'Xoa cong dan thanh cong', 200);
    } catch (error) {
      logger.error('Delete citizen controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('Khong the xoa')) {
        return errorResponse(res, 'CANNOT_DELETE', error.message, 400);
      }

      return errorResponse(
        res,
        'DELETE_CITIZEN_FAILED',
        'Xoa cong dan that bai',
        500
      );
    }
  }

  /**
   * @route GET /api/citizens/stats/gender
   * @desc Thong ke cong dan theo gioi tinh
   * @access Private (Admin, Staff, Viewer)
   */
  async getStatsByGender(req, res) {
    try {
      let wardId = req.query.wardId;

      // Staff chi xem duoc thong ke cua Ward minh quan ly
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const stats = await citizenService.getStatsByGender(wardId);

      return successResponse(
        res,
        stats,
        'Lay thong ke theo gioi tinh thanh cong',
        200
      );
    } catch (error) {
      logger.error('Get stats by gender controller error:', error);
      return errorResponse(
        res,
        'GET_STATS_FAILED',
        'Lay thong ke that bai',
        500
      );
    }
  }

  /**
   * @route GET /api/citizens/stats/age-group
   * @desc Thong ke cong dan theo do tuoi
   * @access Private (Admin, Staff, Viewer)
   */
  async getStatsByAgeGroup(req, res) {
    try {
      let wardId = req.query.wardId;

      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        wardId = req.allowedWardId;
      }

      const stats = await citizenService.getStatsByAgeGroup(wardId);

      return successResponse(
        res,
        stats,
        'Lay thong ke theo do tuoi thanh cong',
        200
      );
    } catch (error) {
      logger.error('Get stats by age group controller error:', error);
      return errorResponse(
        res,
        'GET_STATS_FAILED',
        'Lay thong ke that bai',
        500
      );
    }
  }
}

module.exports = new CitizenController();