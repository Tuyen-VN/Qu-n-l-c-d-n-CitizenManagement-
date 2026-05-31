const authService = require('../services/auth.service');
const {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} = require('../utils/response');
const logger = require('../utils/logger');

class AuthController {
  /**
   * @route POST /api/auth/login
   * @desc Dang nhap
   * @access Public
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      const result = await authService.login(username, password);

      return successResponse(
        res,
        result,
        'Dang nhap thanh cong',
        200
      );
    } catch (error) {
      logger.error('Login controller error:', error);

      if (
        error.message.includes('khong dung') ||
        error.message.includes('bi khoa')
      ) {
        return unauthorizedResponse(res, error.message);
      }

      return errorResponse(
        res,
        'LOGIN_FAILED',
        'Dang nhap that bai',
        500
      );
    }
  }

  /**
   * @route POST /api/auth/refresh
   * @desc Lam moi access token
   * @access Public
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return errorResponse(
          res,
          'MISSING_REFRESH_TOKEN',
          'Refresh token la bat buoc',
          400
        );
      }

      const result = await authService.refreshAccessToken(refreshToken);

      return successResponse(
        res,
        result,
        'Lam moi token thanh cong',
        200
      );
    } catch (error) {
      logger.error('Refresh token controller error:', error);

      if (
        error.message.includes('khong hop le') ||
        error.message.includes('het han')
      ) {
        return unauthorizedResponse(res, error.message);
      }

      return errorResponse(
        res,
        'REFRESH_TOKEN_FAILED',
        'Lam moi token that bai',
        500
      );
    }
  }

  /**
   * @route POST /api/auth/logout
   * @desc Dang xuat
   * @access Private
   */
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      return successResponse(res, null, 'Dang xuat thanh cong', 200);
    } catch (error) {
      logger.error('Logout controller error:', error);
      return errorResponse(
        res,
        'LOGOUT_FAILED',
        'Dang xuat that bai',
        500
      );
    }
  }

  /**
   * @route POST /api/auth/change-password
   * @desc Doi mat khau
   * @access Private
   */
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const { userId } = req.user;

      await authService.changePassword(userId, oldPassword, newPassword);

      return successResponse(res, null, 'Doi mat khau thanh cong', 200);
    } catch (error) {
      logger.error('Change password controller error:', error);

      if (error.message.includes('khong dung')) {
        return errorResponse(
          res,
          'INVALID_OLD_PASSWORD',
          error.message,
          400
        );
      }

      return errorResponse(
        res,
        'CHANGE_PASSWORD_FAILED',
        'Doi mat khau that bai',
        500
      );
    }
  }

  /**
   * @route GET /api/auth/me
   * @desc Lay thong tin user hien tai
   * @access Private
   */
  async getCurrentUser(req, res) {
    try {
      return successResponse(
        res,
        {
          userId: req.user.userId,
          username: req.user.username,
          roleName: req.user.roleName,
          wardId: req.user.wardId,
        },
        null,
        200
      );
    } catch (error) {
      logger.error('Get current user error:', error);
      return errorResponse(
        res,
        'GET_USER_FAILED',
        'Lay thong tin nguoi dung that bai',
        500
      );
    }
  }
}

module.exports = new AuthController();