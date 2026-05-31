const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection, sql } = require('../config/database');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Dang nhap
   * @param {string} username - Ten dang nhap
   * @param {string} password - Mat khau
   * @returns {object} - Access token va refresh token
   */
  async login(username, password) {
    try {
      const pool = await getConnection();

      // Tim user trong database
      const result = await pool
        .request()
        .input('username', sql.NVarChar, username)
        .query(`
          SELECT
            u.user_id, u.username, u.password_hash, u.full_name,
            u.email, u.phone, u.is_active, u.ward_id,
            r.role_id, r.role_name
          FROM Users u
          INNER JOIN Roles r ON u.role_id = r.role_id
          WHERE u.username = @username
        `);

      if (result.recordset.length === 0) {
        throw new Error('Ten dang nhap hoac mat khau khong dung');
      }

      const user = result.recordset[0];

      // Kiem tra tai khoan co bi khoa khong
      if (!user.is_active) {
        throw new Error('Tai khoan da bi khoa');
      }

      // Xac thuc mat khau
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        throw new Error('Ten dang nhap hoac mat khau khong dung');
      }

      // Tao access token
      const accessToken = this.generateAccessToken({
        userId: user.user_id,
        username: user.username,
        roleId: user.role_id,
        roleName: user.role_name,
        wardId: user.ward_id,
      });

      // Tao refresh token
      const refreshToken = this.generateRefreshToken({
        userId: user.user_id,
      });

      // Luu refresh token vao database
      await this.saveRefreshToken(user.user_id, refreshToken);

      // Cap nhat last_login
      await pool
        .request()
        .input('userId', sql.Int, user.user_id)
        .query('UPDATE Users SET last_login = GETDATE() WHERE user_id = @userId');

      logger.info(`User ${username} logged in successfully`);

      return {
        accessToken,
        refreshToken,
        user: {
          userId: user.user_id,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role_name,
          wardId: user.ward_id,
        },
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Tao access token
   * @param {object} payload - Du lieu token
   * @returns {string} - JWT token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });
  }

  /**
   * Tao refresh token
   * @param {object} payload - Du lieu token
   * @returns {string} - JWT refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  /**
   * Luu refresh token vao database
   * @param {number} userId - ID nguoi dung
   * @param {string} token - Refresh token
   */
  async saveRefreshToken(userId, token) {
    try {
      const pool = await getConnection();

      // Tinh thoi gian het han
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000);

      await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('token', sql.NVarChar, token)
        .input('expiresAt', sql.DateTime, expiresAt)
        .query(`
          INSERT INTO RefreshTokens (user_id, token, expires_at)
          VALUES (@userId, @token, @expiresAt)
        `);
    } catch (error) {
      logger.error('Save refresh token failed:', error);
      throw error;
    }
  }

  /**
   * Lam moi access token
   * @param {string} refreshToken - Refresh token
   * @returns {object} - Access token moi
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Xac thuc refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );

      const pool = await getConnection();

      // Kiem tra refresh token con hop le khong
      const result = await pool
        .request()
        .input('token', sql.NVarChar, refreshToken)
        .input('userId', sql.Int, decoded.userId)
        .query(`
          SELECT * FROM RefreshTokens
          WHERE token = @token
            AND user_id = @userId
            AND is_revoked = 0
            AND expires_at > GETDATE()
        `);

      if (result.recordset.length === 0) {
        throw new Error('Refresh token khong hop le hoac da het han');
      }

      // Lay thong tin user
      const userResult = await pool
        .request()
        .input('userId', sql.Int, decoded.userId)
        .query(`
          SELECT
            u.user_id, u.username, u.is_active, u.ward_id,
            r.role_id, r.role_name
          FROM Users u
          INNER JOIN Roles r ON u.role_id = r.role_id
          WHERE u.user_id = @userId
        `);

      if (userResult.recordset.length === 0 || !userResult.recordset[0].is_active) {
        throw new Error('Nguoi dung khong ton tai hoac da bi khoa');
      }

      const user = userResult.recordset[0];

      // Tao access token moi
      const accessToken = this.generateAccessToken({
        userId: user.user_id,
        username: user.username,
        roleId: user.role_id,
        roleName: user.role_name,
        wardId: user.ward_id,
      });

      return { accessToken };
    } catch (error) {
      logger.error('Refresh token failed:', error);
      throw error;
    }
  }

  /**
   * Dang xuat
   * @param {string} refreshToken - Refresh token can vo hieu hoa
   */
  async logout(refreshToken) {
    try {
      const pool = await getConnection();

      // Vo hieu hoa refresh token
      await pool
        .request()
        .input('token', sql.NVarChar, refreshToken)
        .query(`
          UPDATE RefreshTokens
          SET is_revoked = 1, revoked_at = GETDATE()
          WHERE token = @token
        `);

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Doi mat khau
   * @param {number} userId - ID nguoi dung
   * @param {string} oldPassword - Mat khau cu
   * @param {string} newPassword - Mat khau moi
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      const pool = await getConnection();

      // Lay mat khau hien tai
      const result = await pool
        .request()
        .input('userId', sql.Int, userId)
        .query('SELECT password_hash FROM Users WHERE user_id = @userId');

      if (result.recordset.length === 0) {
        throw new Error('Nguoi dung khong ton tai');
      }

      const user = result.recordset[0];

      // Xac thuc mat khau cu
      const isPasswordValid = await bcrypt.compare(
        oldPassword,
        user.password_hash
      );

      if (!isPasswordValid) {
        throw new Error('Mat khau cu khong dung');
      }

      // Ma hoa mat khau moi
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Cap nhat mat khau
      await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('passwordHash', sql.NVarChar, newPasswordHash)
        .query(`
          UPDATE Users
          SET password_hash = @passwordHash, updated_at = GETDATE()
          WHERE user_id = @userId
        `);

      // Vo hieu hoa tat ca refresh token
      await pool
        .request()
        .input('userId', sql.Int, userId)
        .query(`
          UPDATE RefreshTokens
          SET is_revoked = 1, revoked_at = GETDATE()
          WHERE user_id = @userId AND is_revoked = 0
        `);

      logger.info(`User ${userId} changed password successfully`);
    } catch (error) {
      logger.error('Change password failed:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();