const { getConnection, sql } = require('../config/database');
const logger = require('../utils/logger');

class TemporaryResidenceService {
  /**
   * Lay danh sach tam tru
   */
  async getTemporaryResidences(filters = {}) {
    try {
      const pool = await getConnection();
      const {
        page = 1,
        pageSize = 20,
        searchTerm = null,
        wardId = null,
        status = null,
      } = filters;

      const offset = (page - 1) * pageSize;
      const request = pool.request();

      request.input('pageSize', sql.Int, parseInt(pageSize));
      request.input('offset', sql.Int, offset);

      let whereConditions = [];

      if (searchTerm) {
        request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
        whereConditions.push(
          '(c.full_name LIKE @searchTerm OR c.citizen_code LIKE @searchTerm OR tr.temporary_address LIKE @searchTerm)'
        );
      }

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        whereConditions.push('tr.ward_id = @wardId');
      }

      if (status) {
        request.input('status', sql.NVarChar, status);
        whereConditions.push('tr.status = @status');
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // === 1. Đếm tổng số bản ghi (Phục vụ Phân trang) ===
      const countQuery = `
        SELECT COUNT(*) as total
        FROM TemporaryResidences tr
        INNER JOIN Citizens c ON tr.citizen_id = c.citizen_id
        ${whereClause}
      `;
      const countResult = await request.query(countQuery);
      const totalCount = countResult.recordset[0].total;

      // === 2. Lấy dữ liệu thực tế (Chỉ JOIN đúng bảng Wards để lấy Tổ dân phố) ===
      const dataQuery = `
        SELECT 
          tr.temp_residence_id, tr.citizen_id, tr.temporary_address, 
          tr.reason, tr.start_date, tr.end_date, tr.status, tr.created_at,
          c.full_name, c.citizen_code, c.phone,
          w.ward_name
        FROM TemporaryResidences tr
        INNER JOIN Citizens c ON tr.citizen_id = c.citizen_id
        LEFT JOIN Wards w ON tr.ward_id = w.ward_id
        ${whereClause}
        ORDER BY tr.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `;
      
      const dataResult = await request.query(dataQuery);

      return {
        data: dataResult.recordset,
        totalCount,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } catch (error) {
      logger.error('Get temporary residences failed:', error);
      throw error;
    }
  }

  /**
   * Lay chi tiet tam tru
   */
  async getTemporaryResidenceById(tempResId) {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input('tempResId', sql.Int, tempResId)
        .query(`
          SELECT
            tr.*,
            c.citizen_code,
            c.full_name,
            c.date_of_birth,
            c.gender,
            c.phone,
            c.email,
            c.permanent_address,
            w.ward_name,
            w.ward_code,
            d.district_name,
            d.district_code,
            p.province_name,
            p.province_code,
            DATEDIFF(DAY, GETDATE(), tr.end_date) as days_remaining,
            DATEDIFF(DAY, tr.start_date, tr.end_date) as total_days
          FROM TemporaryResidences tr
          INNER JOIN Citizens c ON tr.citizen_id = c.citizen_id
          INNER JOIN Wards w ON tr.ward_id = w.ward_id
          INNER JOIN Districts d ON w.district_id = d.district_id
          INNER JOIN Provinces p ON d.province_id = p.province_id
          WHERE tr.temp_residence_id = @tempResId
        `);

      if (result.recordset.length === 0) {
        throw new Error('Khong tim thay dang ky tam tru');
      }

      return result.recordset[0];
    } catch (error) {
      logger.error('Get temporary residence by id failed:', error);
      throw error;
    }
  }

  /**
   * Dang ky tam tru
   */
  async createTemporaryResidence(tempResData, createdBy) {
    try {
      const pool = await getConnection();

      // Kiem tra cong dan co ton tai khong
      const citizenCheck = await pool
        .request()
        .input('citizenId', sql.Int, tempResData.citizen_id)
        .query(`
          SELECT citizen_id, full_name, status
          FROM Citizens
          WHERE citizen_id = @citizenId AND is_active = 1
        `);

      if (citizenCheck.recordset.length === 0) {
        throw new Error('Cong dan khong ton tai');
      }

      if (citizenCheck.recordset[0].status !== 'Active') {
        throw new Error('Cong dan phai o trang thai Active');
      }

      // Kiem tra co dang ky tam tru dang hoat dong khong
      const activeCheck = await pool
        .request()
        .input('citizenId', sql.Int, tempResData.citizen_id)
        .query(`
          SELECT temp_residence_id
          FROM TemporaryResidences
          WHERE citizen_id = @citizenId AND status = 'Active'
        `);

      if (activeCheck.recordset.length > 0) {
        throw new Error('Cong dan dang co dang ky tam tru hoat dong');
      }

      // Kiem tra ward ton tai
      const wardCheck = await pool
        .request()
        .input('wardId', sql.Int, tempResData.ward_id)
        .query('SELECT ward_id FROM Wards WHERE ward_id = @wardId');

      if (wardCheck.recordset.length === 0) {
        throw new Error('Phuong/xa khong ton tai');
      }

      // Kiem tra thoi gian hop le
      const startDate = new Date(tempResData.start_date);
      const endDate = new Date(tempResData.end_date);
      const monthsDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 30);

      if (monthsDiff > 12) {
        throw new Error('Thoi han tam tru toi da la 12 thang');
      }

      if (startDate >= endDate) {
        throw new Error('Ngay bat dau phai truoc ngay ket thuc');
      }

      // Tao dang ky tam tru
      const result = await pool
        .request()
        .input('citizen_id', sql.Int, tempResData.citizen_id)
        .input('temporary_address', sql.NVarChar, tempResData.temporary_address)
        .input('ward_id', sql.Int, tempResData.ward_id)
        .input('reason', sql.NVarChar, tempResData.reason || null)
        .input('start_date', sql.Date, tempResData.start_date)
        .input('end_date', sql.Date, tempResData.end_date)
        .input('notes', sql.NVarChar, tempResData.notes || null)
        .input('created_by', sql.Int, createdBy)
        .query(`
          INSERT INTO TemporaryResidences (
            citizen_id, temporary_address, ward_id, reason,
            start_date, end_date, notes, created_by
          )
          OUTPUT INSERTED.temp_residence_id
          VALUES (
            @citizen_id, @temporary_address, @ward_id, @reason,
            @start_date, @end_date, @notes, @created_by
          )
        `);

      const tempResId = result.recordset[0].temp_residence_id;
      logger.info(`Temporary residence created: ${tempResId} by user ${createdBy}`);

      return await this.getTemporaryResidenceById(tempResId);
    } catch (error) {
      logger.error('Create temporary residence failed:', error);
      throw error;
    }
  }

  /**
   * Cap nhat tam tru
   */
  async updateTemporaryResidence(tempResId, tempResData) {
    try {
      const pool = await getConnection();

      // Kiem tra tam tru co ton tai khong
      const tempRes = await this.getTemporaryResidenceById(tempResId);
      if (!tempRes) {
        throw new Error('Khong tim thay dang ky tam tru');
      }

      // Chi cho phep cap nhat neu dang Active
      if (tempRes.status !== 'Active') {
        throw new Error('Chi duoc cap nhat dang ky tam tru dang hoat dong');
      }

      const request = pool.request();
      request.input('tempResId', sql.Int, tempResId);

      let updateFields = [];

      if (tempResData.temporary_address !== undefined) {
        request.input('temporary_address', sql.NVarChar, tempResData.temporary_address);
        updateFields.push('temporary_address = @temporary_address');
      }
      if (tempResData.reason !== undefined) {
        request.input('reason', sql.NVarChar, tempResData.reason);
        updateFields.push('reason = @reason');
      }
      if (tempResData.notes !== undefined) {
        request.input('notes', sql.NVarChar, tempResData.notes);
        updateFields.push('notes = @notes');
      }

      if (updateFields.length === 0) {
        return await this.getTemporaryResidenceById(tempResId);
      }

      updateFields.push('updated_at = GETDATE()');

      const updateQuery = `
        UPDATE TemporaryResidences
        SET ${updateFields.join(', ')}
        WHERE temp_residence_id = @tempResId
      `;

      await request.query(updateQuery);
      logger.info(`Temporary residence updated: ${tempResId}`);

      return await this.getTemporaryResidenceById(tempResId);
    } catch (error) {
      logger.error('Update temporary residence failed:', error);
      throw error;
    }
  }

  /**
   * Gia han tam tru
   */
  async extendTemporaryResidence(tempResId, newEndDate) {
    try {
      const pool = await getConnection();

      // Kiem tra tam tru co ton tai khong
      const tempRes = await this.getTemporaryResidenceById(tempResId);
      if (!tempRes) {
        throw new Error('Khong tim thay dang ky tam tru');
      }

      if (tempRes.status !== 'Active') {
        throw new Error('Chi duoc gia han dang ky tam tru dang hoat dong');
      }

      // Kiem tra thoi gian gia han hop le
      const currentEndDate = new Date(tempRes.end_date);
      const extendedEndDate = new Date(newEndDate);

      if (extendedEndDate <= currentEndDate) {
        throw new Error('Ngay ket thuc moi phai sau ngay ket thuc hien tai');
      }

      const startDate = new Date(tempRes.start_date);
      const monthsDiff = (extendedEndDate - startDate) / (1000 * 60 * 60 * 24 * 30);

      if (monthsDiff > 12) {
        throw new Error('Tong thoi gian tam tru khong duoc vuot qua 12 thang');
      }

      // Gia han
      await pool
        .request()
        .input('tempResId', sql.Int, tempResId)
        .input('newEndDate', sql.Date, newEndDate)
        .query(`
          UPDATE TemporaryResidences
          SET end_date = @newEndDate, updated_at = GETDATE()
          WHERE temp_residence_id = @tempResId
        `);

      logger.info(`Temporary residence extended: ${tempResId}`);

      return await this.getTemporaryResidenceById(tempResId);
    } catch (error) {
      logger.error('Extend temporary residence failed:', error);
      throw error;
    }
  }

  /**
   * Huy dang ky tam tru
   */
  async cancelTemporaryResidence(tempResId) {
    try {
      const pool = await getConnection();

      // Kiem tra tam tru co ton tai khong
      const tempRes = await this.getTemporaryResidenceById(tempResId);
      if (!tempRes) {
        throw new Error('Khong tim thay dang ky tam tru');
      }

      if (tempRes.status !== 'Active') {
        throw new Error('Chi duoc huy dang ky tam tru dang hoat dong');
      }

      // Huy dang ky
      await pool
        .request()
        .input('tempResId', sql.Int, tempResId)
        .query(`
          UPDATE TemporaryResidences
          SET status = 'Cancelled', updated_at = GETDATE()
          WHERE temp_residence_id = @tempResId
        `);

      logger.info(`Temporary residence cancelled: ${tempResId}`);
    } catch (error) {
      logger.error('Cancel temporary residence failed:', error);
      throw error;
    }
  }

  /**
   * Lay danh sach tam tru sap het han
   */
  async getExpiringResidences(daysBeforeExpiry = 30, wardId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input('daysBeforeExpiry', sql.Int, daysBeforeExpiry);

      let whereConditions = [
        "tr.status = 'Active'",
        'tr.end_date >= CAST(GETDATE() AS DATE)',
        'DATEDIFF(DAY, GETDATE(), tr.end_date) <= @daysBeforeExpiry'
      ];

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        whereConditions.push('tr.ward_id = @wardId');
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      const query = `
        SELECT
          tr.temp_residence_id,
          c.citizen_code,
          c.full_name,
          c.phone,
          tr.temporary_address,
          tr.end_date,
          DATEDIFF(DAY, GETDATE(), tr.end_date) as days_remaining
        FROM TemporaryResidences tr
        INNER JOIN Citizens c ON tr.citizen_id = c.citizen_id
        ${whereClause}
        ORDER BY tr.end_date
      `;

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error('Get expiring residences failed:', error);
      throw error;
    }
  }

  /**
   * Thong ke tam tru
   */
  async getStats(wardId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      let whereClause = '';
      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        whereClause = 'WHERE tr.ward_id = @wardId';
      }

      const query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN tr.status = 'Active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN tr.status = 'Expired' THEN 1 ELSE 0 END) as expired_count,
          SUM(CASE WHEN tr.status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled_count,
          SUM(CASE WHEN DATEDIFF(DAY, GETDATE(), tr.end_date) <= 30 AND tr.status = 'Active' THEN 1 ELSE 0 END) as expiring_soon
        FROM TemporaryResidences tr
        ${whereClause}
      `;

      const result = await request.query(query);
      return result.recordset[0];
    } catch (error) {
      logger.error('Get temp residence stats failed:', error);
      throw error;
    }
  }
}

module.exports = new TemporaryResidenceService();