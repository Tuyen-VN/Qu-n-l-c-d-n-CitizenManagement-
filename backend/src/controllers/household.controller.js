const householdService = require('../services/household.service');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
  paginationResponse,
} = require('../utils/response');
const logger = require('../utils/logger');

class HouseholdController {
  /**
   * @route GET /api/households
   * @desc Lay danh sach ho khau
   * @access Private (Admin, Staff, Viewer)
   */
  async getHouseholds(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        searchTerm,
        minMembers,
        maxMembers,
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
        minMembers,
        maxMembers,
      };

      const result = await householdService.getHouseholds(filters);

      return paginationResponse(
        res,
        result.data,
        result.page,
        result.pageSize,
        result.totalCount,
        'Lay danh sach ho khau thanh cong'
      );
    } catch (error) {
      logger.error('Get households controller error:', error);
      return errorResponse(
        res,
        'GET_HOUSEHOLDS_FAILED',
        'Lay danh sach ho khau that bai',
        500
      );
    }
  }

  /**
   * @route GET /api/households/:id
   * @desc Lay thong tin chi tiet ho khau
   * @access Private (Admin, Staff, Viewer)
   */
  async getHouseholdById(req, res) {
    try {
      const { id } = req.params;
      const household = await householdService.getHouseholdById(id);

      // Kiem tra quyen truy cap
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (household.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay ho khau');
        }
      }

      return successResponse(
        res,
        household,
        'Lay thong tin ho khau thanh cong',
        200
      );
    } catch (error) {
      logger.error('Get household by id controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      return errorResponse(
        res,
        'GET_HOUSEHOLD_FAILED',
        'Lay thong tin ho khau that bai',
        500
      );
    }
  }

  /**
   * @route POST /api/households
   * @desc Tao ho khau moi
   * @access Private (Admin, Staff)
   */
  async createHousehold(req, res) {
    try {
      const householdData = req.body;

      // Neu la Staff, chi duoc tao household trong Ward cua minh
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (householdData.ward_id !== req.allowedWardId) {
          return errorResponse(
            res,
            'FORBIDDEN',
            'Ban chi duoc tao ho khau trong phuong/xa ma ban quan ly',
            403
          );
        }
      }

      const household = await householdService.createHousehold(
        householdData,
        req.user.userId
      );

      return successResponse(
        res,
        household,
        'Tao ho khau thanh cong',
        201
      );
    } catch (error) {
      logger.error('Create household controller error:', error);

      if (error.message.includes('da ton tai') || error.message.includes('da la chu ho')) {
        return conflictResponse(res, error.message);
      }

      if (error.message.includes('khong ton tai') || error.message.includes('phai')) {
        return errorResponse(res, 'INVALID_DATA', error.message, 400);
      }

      return errorResponse(
        res,
        'CREATE_HOUSEHOLD_FAILED',
        'Tao ho khau that bai',
        500
      );
    }
  }

  /**
   * @route PUT /api/households/:id
   * @desc Cap nhat thong tin ho khau
   * @access Private (Admin, Staff)
   */
  async updateHousehold(req, res) {
    try {
      const { id } = req.params;
      const householdData = req.body;

      // Kiem tra quyen truy cap
      const existingHousehold = await householdService.getHouseholdById(id);
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (existingHousehold.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay ho khau');
        }
      }

      const household = await householdService.updateHousehold(id, householdData);

      return successResponse(
        res,
        household,
        'Cap nhat thong tin ho khau thanh cong',
        200
      );
    } catch (error) {
      logger.error('Update household controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      return errorResponse(
        res,
        'UPDATE_HOUSEHOLD_FAILED',
        'Cap nhat thong tin ho khau that bai',
        500
      );
    }
  }

  /**
   * @route DELETE /api/households/:id
   * @desc Xoa ho khau
   * @access Private (Admin only)
   */
  async deleteHousehold(req, res) {
    try {
      const { id } = req.params;

      await householdService.deleteHousehold(id);

      return successResponse(res, null, 'Xoa ho khau thanh cong', 200);
    } catch (error) {
      logger.error('Delete household controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('Khong the xoa')) {
        return errorResponse(res, 'CANNOT_DELETE', error.message, 400);
      }

      return errorResponse(
        res,
        'DELETE_HOUSEHOLD_FAILED',
        'Xoa ho khau that bai',
        500
      );
    }
  }

  /**
   * @route GET /api/households/:id/members
   * @desc Lay danh sach thanh vien ho khau
   * @access Private (Admin, Staff, Viewer)
   */
  async getHouseholdMembers(req, res) {
    try {
      const { id } = req.params;

      // Kiem tra quyen truy cap
      const household = await householdService.getHouseholdById(id);
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (household.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay ho khau');
        }
      }

      const members = await householdService.getHouseholdMembers(id);

      return successResponse(
        res,
        members,
        'Lay danh sach thanh vien thanh cong',
        200
      );
    } catch (error) {
      logger.error('Get household members controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      return errorResponse(
        res,
        'GET_MEMBERS_FAILED',
        'Lay danh sach thanh vien that bai',
        500
      );
    }
  }

  /**
   * @route POST /api/households/:id/members
   * @desc Them thanh vien vao ho khau
   * @access Private (Admin, Staff)
   */
  async addHouseholdMember(req, res) {
    try {
      const { id } = req.params;
      const memberData = req.body;

      // Kiem tra quyen truy cap
      const household = await householdService.getHouseholdById(id);
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (household.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay ho khau');
        }
      }

      const members = await householdService.addHouseholdMember(id, memberData);

      return successResponse(
        res,
        members,
        'Them thanh vien thanh cong',
        201
      );
    } catch (error) {
      logger.error('Add household member controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('da thuoc') || error.message.includes('da dat')) {
        return errorResponse(res, 'CONFLICT', error.message, 400);
      }

      if (error.message.includes('phai')) {
        return errorResponse(res, 'INVALID_DATA', error.message, 400);
      }

      return errorResponse(
        res,
        'ADD_MEMBER_FAILED',
        'Them thanh vien that bai',
        500
      );
    }
  }

  /**
   * @route DELETE /api/households/:id/members/:citizenId
   * @desc Xoa thanh vien khoi ho khau
   * @access Private (Admin, Staff)
   */
  async removeHouseholdMember(req, res) {
    try {
      const { id, citizenId } = req.params;

      // Kiem tra quyen truy cap
      const household = await householdService.getHouseholdById(id);
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (household.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay ho khau');
        }
      }

      await householdService.removeHouseholdMember(id, parseInt(citizenId));

      return successResponse(res, null, 'Xoa thanh vien thanh cong', 200);
    } catch (error) {
      logger.error('Remove household member controller error:', error);

      if (error.message.includes('Khong tim thay') || error.message.includes('khong co')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('Khong the xoa')) {
        return errorResponse(res, 'CANNOT_REMOVE', error.message, 400);
      }

      return errorResponse(
        res,
        'REMOVE_MEMBER_FAILED',
        'Xoa thanh vien that bai',
        500
      );
    }
  }

  /**
   * @route PUT /api/households/:id/head
   * @desc Doi chu ho
   * @access Private (Admin, Staff)
   */
  async changeHeadOfHousehold(req, res) {
    try {
      const { id } = req.params;
      const { new_head_citizen_id } = req.body;

      // Kiem tra quyen truy cap
      const household = await householdService.getHouseholdById(id);
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (household.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay ho khau');
        }
      }

      const updatedHousehold = await householdService.changeHeadOfHousehold(
        id,
        new_head_citizen_id
      );

      return successResponse(
        res,
        updatedHousehold,
        'Doi chu ho thanh cong',
        200
      );
    } catch (error) {
      logger.error('Change head of household controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('phai')) {
        return errorResponse(res, 'INVALID_DATA', error.message, 400);
      }

      return errorResponse(
        res,
        'CHANGE_HEAD_FAILED',
        'Doi chu ho that bai',
        500
      );
    }
  }

  /**
   * @route POST /api/households/:id/transfer
   * @desc Chuyen ho khau
   * @access Private (Admin, Staff)
   */
  async transferHousehold(req, res) {
    try {
      const { id } = req.params;
      const transferData = req.body;

      // Kiem tra quyen truy cap
      const household = await householdService.getHouseholdById(id);
      if (req.user.roleName === 'Staff' && req.allowedWardId) {
        if (household.ward_id !== req.allowedWardId) {
          return notFoundResponse(res, 'Khong tim thay ho khau');
        }
      }

      const updatedHousehold = await householdService.transferHousehold(
        id,
        transferData
      );

      return successResponse(
        res,
        updatedHousehold,
        'Chuyen ho khau thanh cong',
        200
      );
    } catch (error) {
      logger.error('Transfer household controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('khong ton tai')) {
        return errorResponse(res, 'INVALID_DATA', error.message, 400);
      }

      return errorResponse(
        res,
        'TRANSFER_HOUSEHOLD_FAILED',
        'Chuyen ho khau that bai',
        500
      );
    }
  }
}

module.exports = new HouseholdController();