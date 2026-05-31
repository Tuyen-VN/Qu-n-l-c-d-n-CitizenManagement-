const userService = require('../services/user.service');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  conflictResponse,
  paginationResponse,
} = require('../utils/response');
const logger = require('../utils/logger');

class UserController {
  /**
   * @route GET /api/users
   * @desc Lay danh sach nguoi dung
   * @access Private (Admin only)
   */
  async getUsers(req, res) {
    try {
      const {
        page = 1,
        pageSize = 20,
        searchTerm,
        roleId,
        wardId,
        isActive,
      } = req.query;

      const filters = {
        page,
        pageSize,
        searchTerm,
        roleId,
        wardId,
        isActive: isActive !== undefined ? isActive === 'true' : null,
      };

      const result = await userService.getUsers(filters);

      return paginationResponse(
        res,
        result.data,
        result.page,
        result.pageSize,
        result.totalCount,
        'Lay danh sach nguoi dung thanh cong'
      );
    } catch (error) {
      logger.error('Get users controller error:', error);
      return errorResponse(
        res,
        'GET_USERS_FAILED',
        'Lay danh sach nguoi dung that bai',
        500
      );
    }
  }

  /**
   * @route GET /api/users/:id
   * @desc Lay thong tin chi tiet nguoi dung
   * @access Private (Admin only)
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      return successResponse(
        res,
        user,
        'Lay thong tin nguoi dung thanh cong',
        200
      );
    } catch (error) {
      logger.error('Get user by id controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      return errorResponse(
        res,
        'GET_USER_FAILED',
        'Lay thong tin nguoi dung that bai',
        500
      );
    }
  }

  /**
   * @route POST /api/users
   * @desc Tao nguoi dung moi
   * @access Private (Admin only)
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);

      return successResponse(
        res,
        user,
        'Tao nguoi dung thanh cong',
        201
      );
    } catch (error) {
      logger.error('Create user controller error:', error);

      if (error.message.includes('da ton tai')) {
        return conflictResponse(res, error.message);
      }

      if (error.message.includes('khong ton tai')) {
        return errorResponse(res, 'INVALID_DATA', error.message, 400);
      }

      return errorResponse(
        res,
        'CREATE_USER_FAILED',
        'Tao nguoi dung that bai',
        500
      );
    }
  }

  /**
   * @route PUT /api/users/:id
   * @desc Cap nhat thong tin nguoi dung
   * @access Private (Admin only)
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;

      const user = await userService.updateUser(id, userData);

      return successResponse(
        res,
        user,
        'Cap nhat thong tin nguoi dung thanh cong',
        200
      );
    } catch (error) {
      logger.error('Update user controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('da ton tai')) {
        return conflictResponse(res, error.message);
      }

      return errorResponse(
        res,
        'UPDATE_USER_FAILED',
        'Cap nhat thong tin nguoi dung that bai',
        500
      );
    }
  }

  /**
   * @route PUT /api/users/:id/role
   * @desc Thay doi role cua nguoi dung
   * @access Private (Admin only)
   */
  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role_id } = req.body;

      const user = await userService.updateUserRole(id, role_id);

      return successResponse(
        res,
        user,
        'Thay doi role thanh cong',
        200
      );
    } catch (error) {
      logger.error('Update user role controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('khong ton tai')) {
        return errorResponse(res, 'INVALID_DATA', error.message, 400);
      }

      return errorResponse(
        res,
        'UPDATE_ROLE_FAILED',
        'Thay doi role that bai',
        500
      );
    }
  }

  /**
   * @route PUT /api/users/:id/status
   * @desc Thay doi trang thai nguoi dung (khoa/mo khoa)
   * @access Private (Admin only)
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      const user = await userService.updateUserStatus(id, is_active);

      return successResponse(
        res,
        user,
        `${is_active ? 'Mo khoa' : 'Khoa'} tai khoan thanh cong`,
        200
      );
    } catch (error) {
      logger.error('Update user status controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      return errorResponse(
        res,
        'UPDATE_STATUS_FAILED',
        'Thay doi trang thai that bai',
        500
      );
    }
  }

  /**
   * @route DELETE /api/users/:id
   * @desc Xoa nguoi dung
   * @access Private (Admin only)
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Khong cho phep tu xoa chinh minh
      if (parseInt(id) === req.user.userId) {
        return errorResponse(
          res,
          'CANNOT_DELETE_SELF',
          'Khong the xoa chinh ban than',
          400
        );
      }

      await userService.deleteUser(id);

      return successResponse(res, null, 'Xoa nguoi dung thanh cong', 200);
    } catch (error) {
      logger.error('Delete user controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      if (error.message.includes('admin cuoi cung')) {
        return errorResponse(res, 'CANNOT_DELETE', error.message, 400);
      }

      return errorResponse(
        res,
        'DELETE_USER_FAILED',
        'Xoa nguoi dung that bai',
        500
      );
    }
  }

  /**
   * @route POST /api/users/:id/reset-password
   * @desc Reset mat khau nguoi dung
   * @access Private (Admin only)
   */
  async resetUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      await userService.resetUserPassword(id, new_password);

      return successResponse(
        res,
        null,
        'Reset mat khau thanh cong',
        200
      );
    } catch (error) {
      logger.error('Reset password controller error:', error);

      if (error.message.includes('Khong tim thay')) {
        return notFoundResponse(res, error.message);
      }

      return errorResponse(
        res,
        'RESET_PASSWORD_FAILED',
        'Reset mat khau that bai',
        500
      );
    }
  }
}

module.exports = new UserController();