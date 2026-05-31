const bcrypt = require('bcrypt');
const { getConnection, sql } = require('../config/database');
const logger = require('../utils/logger');

class UserService {
  /**
   * Lay danh sach nguoi dung (co phan trang va tim kiem)
   */
  async getUsers(filters = {}) {
    try {
      const pool = await getConnection();
      const {
        page = 1,
        pageSize = 20,
        searchTerm = null,
        roleId = null,
        wardId = null,
        isActive = null,
      } = filters;

      const offset = (page - 1) * pageSize;
      const request = pool.request();

      request.input('pageSize', sql.Int, parseInt(pageSize));
      request.input('offset', sql.Int, offset);

      let whereConditions = [];

      if (searchTerm) {
        request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
        whereConditions.push(
          '(u.username LIKE @searchTerm OR u.full_name LIKE @searchTerm OR u.email LIKE @searchTerm)'
        );
      }

      if (roleId) {
        request.input('roleId', sql.Int, roleId);
        whereConditions.push('u.role_id = @roleId');
      }

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        whereConditions.push('u.ward_id = @wardId');
      }

      if (isActive !== null) {
        request.input('isActive', sql.Bit, isActive);
        whereConditions.push('u.is_active = @isActive');
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM Users u
        ${whereClause}
      `;

      const countResult = await request.query(countQuery);
      const totalCount = countResult.recordset[0].total;

      // Data query
      const dataQuery = `
        SELECT
          u.user_id,
          u.username,
          u.full_name,
          u.email,
          u.phone,
          u.role_id,
          r.role_name,
          u.ward_id,
          w.ward_name,
          d.district_name,
          u.is_active,
          u.last_login,
          u.created_at
        FROM Users u
        INNER JOIN Roles r ON u.role_id = r.role_id
        LEFT JOIN Wards w ON u.ward_id = w.ward_id
        LEFT JOIN Districts d ON w.district_id = d.district_id
        ${whereClause}
        ORDER BY u.created_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
      `;

      const dataResult = await request.query(dataQuery);

      return {
        data: dataResult.recordset,
        totalCount,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      };
    } catch (error) {
      logger.error('Get users failed:', error);
      throw error;
    }
  }

  /**
   * Lay thong tin chi tiet nguoi dung
   */
  async getUserById(userId) {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT
            u.user_id,
            u.username,
            u.full_name,
            u.email,
            u.phone,
            u.role_id,
            r.role_name,
            r.description as role_description,
            u.ward_id,
            w.ward_name,
            w.ward_code,
            d.district_name,
            d.district_code,
            p.province_name,
            p.province_code,
            u.is_active,
            u.last_login,
            u.created_at,
            u.updated_at
          FROM Users u
          INNER JOIN Roles r ON u.role_id = r.role_id
          LEFT JOIN Wards w ON u.ward_id = w.ward_id
          LEFT JOIN Districts d ON w.district_id = d.district_id
          LEFT JOIN Provinces p ON d.province_id = p.province_id
          WHERE u.user_id = @userId
        `);

      if (result.recordset.length === 0) {
        throw new Error('Khong tim thay nguoi dung');
      }

      return result.recordset[0];
    } catch (error) {
      logger.error('Get user by id failed:', error);
      throw error;
    }
  }

  /**
   * Kiem tra username da ton tai chua
   */
  async checkUsernameExists(username, excludeUserId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input('username', sql.NVarChar, username);

      let query = 'SELECT user_id FROM Users WHERE username = @username';

      if (excludeUserId) {
        request.input('excludeUserId', sql.Int, excludeUserId);
        query += ' AND user_id != @excludeUserId';
      }

      const result = await request.query(query);
      return result.recordset.length > 0;
    } catch (error) {
      logger.error('Check username exists failed:', error);
      throw error;
    }
  }

  /**
   * Kiem tra email da ton tai chua
   */
  async checkEmailExists(email, excludeUserId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input('email', sql.NVarChar, email);

      let query = 'SELECT user_id FROM Users WHERE email = @email';

      if (excludeUserId) {
        request.input('excludeUserId', sql.Int, excludeUserId);
        query += ' AND user_id != @excludeUserId';
      }

      const result = await request.query(query);
      return result.recordset.length > 0;
    } catch (error) {
      logger.error('Check email exists failed:', error);
      throw error;
    }
  }

  /**
   * Tao nguoi dung moi
   */
  async createUser(userData) {
    try {
      const pool = await getConnection();

      // Kiem tra username da ton tai chua
      const usernameExists = await this.checkUsernameExists(userData.username);
      if (usernameExists) {
        throw new Error('Ten dang nhap da ton tai');
      }

      // Kiem tra email da ton tai chua (neu co)
      if (userData.email) {
        const emailExists = await this.checkEmailExists(userData.email);
        if (emailExists) {
          throw new Error('Email da ton tai');
        }
      }

      // Kiem tra role co ton tai khong
      const roleCheck = await pool
        .request()
        .input('roleId', sql.Int, userData.role_id)
        .query('SELECT role_id FROM Roles WHERE role_id = @roleId');

      if (roleCheck.recordset.length === 0) {
        throw new Error('Role khong ton tai');
      }

      // Kiem tra ward co ton tai khong (neu co)
      if (userData.ward_id) {
        const wardCheck = await pool
          .request()
          .input('wardId', sql.Int, userData.ward_id)
          .query('SELECT ward_id FROM Wards WHERE ward_id = @wardId');

        if (wardCheck.recordset.length === 0) {
          throw new Error('Phuong/xa khong ton tai');
        }
      }

      // Hash mat khau
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Tao user
      const result = await pool
        .request()
        .input('username', sql.NVarChar, userData.username)
        .input('password_hash', sql.NVarChar, passwordHash)
        .input('full_name', sql.NVarChar, userData.full_name)
        .input('email', sql.NVarChar, userData.email || null)
        .input('phone', sql.NVarChar, userData.phone || null)
        .input('role_id', sql.Int, userData.role_id)
        .input('ward_id', sql.Int, userData.ward_id || null)
        .query(`
          INSERT INTO Users (
            username, password_hash, full_name, email, phone, role_id, ward_id
          )
          OUTPUT INSERTED.user_id
          VALUES (
            @username, @password_hash, @full_name, @email, @phone, @role_id, @ward_id
          )
        `);

      const userId = result.recordset[0].user_id;
      logger.info(`User created: ${userId}`);

      return await this.getUserById(userId);
    } catch (error) {
      logger.error('Create user failed:', error);
      throw error;
    }
  }

  /**
   * Cap nhat thong tin nguoi dung
   */
  async updateUser(userId, userData) {
    try {
      const pool = await getConnection();

      // Kiem tra user co ton tai khong
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Khong tim thay nguoi dung');
      }

      // Kiem tra username trung (neu co thay doi)
      if (userData.username) {
        const usernameExists = await this.checkUsernameExists(
          userData.username,
          userId
        );
        if (usernameExists) {
          throw new Error('Ten dang nhap da ton tai');
        }
      }

      // Kiem tra email trung (neu co thay doi)
      if (userData.email) {
        const emailExists = await this.checkEmailExists(
          userData.email,
          userId
        );
        if (emailExists) {
          throw new Error('Email da ton tai');
        }
      }

      const request = pool.request();
      request.input('userId', sql.Int, userId);

      let updateFields = [];

      if (userData.username) {
        request.input('username', sql.NVarChar, userData.username);
        updateFields.push('username = @username');
      }
      if (userData.full_name) {
        request.input('full_name', sql.NVarChar, userData.full_name);
        updateFields.push('full_name = @full_name');
      }
      if (userData.email !== undefined) {
        request.input('email', sql.NVarChar, userData.email);
        updateFields.push('email = @email');
      }
      if (userData.phone !== undefined) {
        request.input('phone', sql.NVarChar, userData.phone);
        updateFields.push('phone = @phone');
      }
      if (userData.ward_id !== undefined) {
        request.input('ward_id', sql.Int, userData.ward_id);
        updateFields.push('ward_id = @ward_id');
      }

      if (updateFields.length === 0) {
        return await this.getUserById(userId);
      }

      updateFields.push('updated_at = GETDATE()');

      const updateQuery = `
        UPDATE Users
        SET ${updateFields.join(', ')}
        WHERE user_id = @userId
      `;

      await request.query(updateQuery);
      logger.info(`User updated: ${userId}`);

      return await this.getUserById(userId);
    } catch (error) {
      logger.error('Update user failed:', error);
      throw error;
    }
  }

  /**
   * Thay doi role cua nguoi dung
   */
  async updateUserRole(userId, roleId) {
    try {
      const pool = await getConnection();

      // Kiem tra user co ton tai khong
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Khong tim thay nguoi dung');
      }

      // Kiem tra role co ton tai khong
      const roleCheck = await pool
        .request()
        .input('roleId', sql.Int, roleId)
        .query('SELECT role_id, role_name FROM Roles WHERE role_id = @roleId');

      if (roleCheck.recordset.length === 0) {
        throw new Error('Role khong ton tai');
      }

      // Cap nhat role
      await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('roleId', sql.Int, roleId)
        .query(`
          UPDATE Users
          SET role_id = @roleId, updated_at = GETDATE()
          WHERE user_id = @userId
        `);

      // Vo hieu hoa tat ca refresh token khi doi role
      await pool
        .request()
        .input('userId', sql.Int, userId)
        .query(`
          UPDATE RefreshTokens
          SET is_revoked = 1, revoked_at = GETDATE()
          WHERE user_id = @userId AND is_revoked = 0
        `);

      logger.info(`User role updated: ${userId} to role ${roleId}`);

      return await this.getUserById(userId);
    } catch (error) {
      logger.error('Update user role failed:', error);
      throw error;
    }
  }

  /**
   * Thay doi trang thai nguoi dung (khoa/mo khoa)
   */
  async updateUserStatus(userId, isActive) {
    try {
      const pool = await getConnection();

      // Kiem tra user co ton tai khong
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Khong tim thay nguoi dung');
      }

      // Cap nhat trang thai
      await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('isActive', sql.Bit, isActive)
        .query(`
          UPDATE Users
          SET is_active = @isActive, updated_at = GETDATE()
          WHERE user_id = @userId
        `);

      // Neu khoa tai khoan, vo hieu hoa tat ca refresh token
      if (!isActive) {
        await pool
          .request()
          .input('userId', sql.Int, userId)
          .query(`
            UPDATE RefreshTokens
            SET is_revoked = 1, revoked_at = GETDATE()
            WHERE user_id = @userId AND is_revoked = 0
          `);
      }

      logger.info(`User status updated: ${userId} to ${isActive ? 'active' : 'inactive'}`);

      return await this.getUserById(userId);
    } catch (error) {
      logger.error('Update user status failed:', error);
      throw error;
    }
  }

  /**
   * Xoa nguoi dung
   */
  async deleteUser(userId) {
    try {
      const pool = await getConnection();

      // Kiem tra user co ton tai khong
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Khong tim thay nguoi dung');
      }

      // Kiem tra user co phai admin cuoi cung khong
      if (user.role_name === 'Admin') {
        const adminCount = await pool
          .request()
          .query(`
            SELECT COUNT(*) as count
            FROM Users u
            INNER JOIN Roles r ON u.role_id = r.role_id
            WHERE r.role_name = 'Admin' AND u.is_active = 1
          `);

        if (adminCount.recordset[0].count <= 1) {
          throw new Error('Khong the xoa admin cuoi cung trong he thong');
        }
      }

      // Xoa user
      await pool
        .request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM Users WHERE user_id = @userId');

      logger.info(`User deleted: ${userId}`);
    } catch (error) {
      logger.error('Delete user failed:', error);
      throw error;
    }
  }

  /**
   * Reset mat khau nguoi dung (Admin)
   */
  async resetUserPassword(userId, newPassword) {
    try {
      const pool = await getConnection();

      // Kiem tra user co ton tai khong
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('Khong tim thay nguoi dung');
      }

      // Hash mat khau moi
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Cap nhat mat khau
      await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('passwordHash', sql.NVarChar, passwordHash)
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

      logger.info(`User password reset: ${userId}`);
    } catch (error) {
      logger.error('Reset user password failed:', error);
      throw error;
    }
  }
}

module.exports = new UserService();