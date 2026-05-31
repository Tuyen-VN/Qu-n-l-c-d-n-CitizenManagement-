const { getConnection, sql } = require('../config/database');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Ghi log hoat dong
   * @param {number} userId - ID nguoi dung
   * @param {string} action - Hanh dong (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
   * @param {string} tableName - Ten bang du lieu
   * @param {number} recordId - ID ban ghi
   * @param {object} oldValue - Gia tri cu (JSON)
   * @param {object} newValue - Gia tri moi (JSON)
   * @param {string} ipAddress - Dia chi IP
   * @param {string} userAgent - User agent
   */
  async log(
    userId,
    action,
    tableName = null,
    recordId = null,
    oldValue = null,
    newValue = null,
    ipAddress = null,
    userAgent = null
  ) {
    try {
      const pool = await getConnection();

      await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('action', sql.NVarChar, action)
        .input('tableName', sql.NVarChar, tableName)
        .input('recordId', sql.Int, recordId)
        .input('oldValue', sql.NVarChar, oldValue ? JSON.stringify(oldValue) : null)
        .input('newValue', sql.NVarChar, newValue ? JSON.stringify(newValue) : null)
        .input('ipAddress', sql.NVarChar, ipAddress)
        .input('userAgent', sql.NVarChar, userAgent)
        .query(`
          INSERT INTO AuditLogs (
            user_id, action, table_name, record_id,
            old_value, new_value, ip_address, user_agent
          )
          VALUES (
            @userId, @action, @tableName, @recordId,
            @oldValue, @newValue, @ipAddress, @userAgent
          )
        `);

      logger.info(`Audit log created: ${action} on ${tableName} by user ${userId}`);
    } catch (error) {
      // Khong throw error de tranh anh huong den nghiep vu chinh
      logger.error('Audit log failed:', error);
    }
  }

  /**
   * Lay lich su hoat dong
   */
  async getAuditLogs(filters = {}) {
    try {
      const pool = await getConnection();
      const {
        page = 1,
        pageSize = 50,
        userId = null,
        action = null,
        tableName = null,
        startDate = null,
        endDate = null,
      } = filters;

      const offset = (page - 1) * pageSize;
      const request = pool.request();

      request.input('pageSize', sql.Int, parseInt(pageSize));
      request.input('offset', sql.Int, offset);

      let whereConditions = [];

      if (userId) {
        request.input('userId', sql.Int, userId);
        whereConditions.push('al.user_id = @userId');
      }

      if (action) {
        request.input('action', sql.NVarChar, action);
        whereConditions.push('al.action = @action');
      }

      if (tableName) {
        request.input('tableName', sql.NVarChar, tableName);
        whereConditions.push('al.table_name = @tableName');
      }

      if (startDate) {
        request.input('startDate', sql.DateTime, startDate);
        whereConditions.push('al.created_at >= @startDate');
      }

      if (endDate) {
        request.input('endDate', sql.DateTime, endDate);
        whereConditions.push('al.created_at <= @endDate');
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM AuditLogs al
        ${whereClause}
      `;

      const countResult = await request.query(countQuery);
      const totalCount = countResult.recordset[0].total;

      // Data query
      const dataQuery = `
        SELECT
          al.log_id,
          al.user_id,
          u.username,
          u.full_name,
          al.action,
          al.table_name,
          al.record_id,
          al.ip_address,
          al.created_at
        FROM AuditLogs al
        LEFT JOIN Users u ON al.user_id = u.user_id
        ${whereClause}
        ORDER BY al.created_at DESC
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
      logger.error('Get audit logs failed:', error);
      throw error;
    }
  }

  /**
   * Lay chi tiet audit log
   */
  async getAuditLogById(logId) {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input('logId', sql.Int, logId)
        .query(`
          SELECT
            al.*,
            u.username,
            u.full_name
          FROM AuditLogs al
          LEFT JOIN Users u ON al.user_id = u.user_id
          WHERE al.log_id = @logId
        `);

      if (result.recordset.length === 0) {
        throw new Error('Khong tim thay audit log');
      }

      const log = result.recordset[0];

      // Parse JSON fields
      if (log.old_value) {
        log.old_value = JSON.parse(log.old_value);
      }
      if (log.new_value) {
        log.new_value = JSON.parse(log.new_value);
      }

      return log;
    } catch (error) {
      logger.error('Get audit log by id failed:', error);
      throw error;
    }
  }

  /**
   * Xoa audit logs cu (cleanup)
   * @param {number} daysToKeep - So ngay giu log (mac dinh 730 = 2 nam)
   */
  async cleanupOldLogs(daysToKeep = 730) {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input('daysToKeep', sql.Int, daysToKeep)
        .query(`
          DELETE FROM AuditLogs
          WHERE DATEDIFF(DAY, created_at, GETDATE()) > @daysToKeep
        `);

      const deletedCount = result.rowsAffected[0];
      logger.info(`Cleaned up ${deletedCount} old audit logs`);

      return deletedCount;
    } catch (error) {
      logger.error('Cleanup audit logs failed:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();