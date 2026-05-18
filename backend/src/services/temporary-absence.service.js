const { getConnection, sql } = require('../config/database');
const logger = require('../utils/logger');

class TemporaryAbsenceService {
  /**
   * Lay danh sach tam vang
   */
  async getTemporaryAbsences(filters = {}) {
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
          '(c.full_name LIKE @searchTerm OR c.citizen_code LIKE @searchTerm OR ta.destination_address LIKE @searchTerm)'
        );
      }

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        whereConditions.push('c.ward_id = @wardId');
      }

      if (status) {
        request.input('status', sql.NVarChar, status);
        whereConditions.push('ta.status = @status');
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM TemporaryAbsences ta
        INNER JOIN Citizens c ON ta.citizen_id = c.citizen_id
        ${whereClause}
      `;

      const countResult = await request.query(countQuery);
      const totalCount = countResult.recordset[0].total;

      // Data query
      const dataQuery = `
        SELECT
          ta.temp_absence_id,
          ta.citizen_id,
          c.citizen_code,
          c.full_name,
          c.phone,
          w.ward_name as home_ward,
          d.district_name as home_district,
          ta.destination_address,
          ta.reason,
          ta.start_date,
          ta.expected_return_date,
          ta.actual_return_date,
          DATEDIFF(DAY, GETDATE(), ta.expected_return_date) as days_until_return,
          ta.status,
          ta.registration_date,
          ta.created_at
        FROM TemporaryAbsences ta
        INNER JOIN Citizens c ON ta.citizen_id = c.citizen_id
        INNER JOIN Wards w ON c.ward_id = w.ward_id
        INNER JOIN Districts d ON w.district_id = d.district_id
        ${whereClause}
        ORDER BY ta.start_date DESC, ta.created_at DESC
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
      logger.error('Get temporary absences failed:', error);
      throw error;
    }
  }

  /**
   * Lay chi tiet tam vang
   */
  async getTemporaryAbsenceById(tempAbsId) {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input('tempAbsId', sql.Int, tempAbsId)
        .query(`
          SELECT
            ta.*,
            c.citizen_code,
            c.full_name,
            c.date_of_birth,
            c.gender,
            c.phone,
            c.email,
            c.permanent_address,
            w.ward_name as home_ward,
            w.ward_code as home_ward_code,
            d.district_name as home_district,
            p.province_name as home_province,
            DATEDIFF(DAY, GETDATE(), ta.expected_return_date) as days_until_return,
            DATEDIFF(DAY, ta.start_date, ISNULL(ta.actual_return_date, ta.expected_return_date)) as total_days_absent
          FROM TemporaryAbsences ta
          INNER JOIN Citizens c ON ta.citizen_id = c.citizen_id
          INNER JOIN Wards w ON c.ward_id = w.ward_id
          INNER JOIN Districts d ON w.district_id = d.district_id
          INNER JOIN Provinces p ON d.province_id = p.province_id
          WHERE ta.temp_absence_id = @tempAbsId
        `);

      if (result.recordset.length === 0) {
        throw new Error('Khong tim thay dang ky tam vang');
      }

      return result.recordset[0];
    } catch (error) {
      logger.error('Get temporary absence by id failed:', error);
      throw error;
    }
  }

  /**
   * Dang ky tam vang
   */
  async createTemporaryAbsence(tempAbsData, createdBy) {
    const pool = await getConnection();
    const transaction = pool.transaction(); // Bắt đầu Transaction
    try {
      await transaction.begin();

      const citizenCheck = await transaction.request()
        .input('citizenId', sql.Int, tempAbsData.citizen_id)
        .query(`SELECT citizen_id, full_name, status, ward_id FROM Citizens WHERE citizen_id = @citizenId AND is_active = 1`);

      if (citizenCheck.recordset.length === 0) throw new Error('Cong dan khong ton tai');
      const citizen = citizenCheck.recordset[0];
      if (citizen.status !== 'Active') throw new Error('Cong dan phai o trang thai Active');

      const activeCheck = await transaction.request()
        .input('citizenId', sql.Int, tempAbsData.citizen_id)
        .query(`SELECT temp_absence_id FROM TemporaryAbsences WHERE citizen_id = @citizenId AND status = 'Active'`);

      if (activeCheck.recordset.length > 0) throw new Error('Cong dan dang co dang ky tam vang hoat dong');

      const startDate = new Date(tempAbsData.start_date);
      const expectedReturnDate = new Date(tempAbsData.expected_return_date);
      const monthsDiff = (expectedReturnDate - startDate) / (1000 * 60 * 60 * 24 * 30);

      if (monthsDiff > 12) throw new Error('Thoi han tam vang toi da la 12 thang');
      if (startDate >= expectedReturnDate) throw new Error('Ngay bat dau phai truoc ngay du kien ve');

      // Chèn phiếu tạm vắng
      const result = await transaction.request()
        .input('citizen_id', sql.Int, tempAbsData.citizen_id)
        .input('destination_address', sql.NVarChar, tempAbsData.destination_address)
        .input('destination_ward_code', sql.NVarChar, tempAbsData.destination_ward_code || null)
        .input('reason', sql.NVarChar, tempAbsData.reason || null)
        .input('start_date', sql.Date, tempAbsData.start_date)
        .input('expected_return_date', sql.Date, tempAbsData.expected_return_date)
        .input('notes', sql.NVarChar, tempAbsData.notes || null)
        .input('created_by', sql.Int, createdBy)
        .query(`
          INSERT INTO TemporaryAbsences (
            citizen_id, destination_address, destination_ward_code, reason,
            start_date, expected_return_date, notes, created_by
          )
          OUTPUT INSERTED.temp_absence_id
          VALUES (
            @citizen_id, @destination_address, @destination_ward_code, @reason,
            @start_date, @expected_return_date, @notes, @created_by
          )
        `);

      const tempAbsId = result.recordset[0].temp_absence_id;

      // === LIÊN THÔNG DỮ LIỆU: ĐỔI TRẠNG THÁI SANG 'Absent' ===
      await transaction.request()
        .input('citizen_id_update', sql.Int, tempAbsData.citizen_id)
        .query(`UPDATE Citizens SET status = 'Absent', updated_at = GETDATE() WHERE citizen_id = @citizen_id_update`);

      await transaction.commit();
      logger.info(`Temporary absence created: ${tempAbsId} by user ${createdBy}`);

      return await this.getTemporaryAbsenceById(tempAbsId);
    } catch (error) {
      if (transaction) await transaction.rollback();
      logger.error('Create temporary absence failed:', error);
      throw error;
    }
  }
  

  /**
   * Cap nhat tam vang
   */
  async updateTemporaryAbsence(tempAbsId, tempAbsData) {
    try {
      const pool = await getConnection();

      // Kiem tra tam vang co ton tai khong
      const tempAbs = await this.getTemporaryAbsenceById(tempAbsId);
      if (!tempAbs) {
        throw new Error('Khong tim thay dang ky tam vang');
      }

      // Chi cho phep cap nhat neu dang Active
      if (tempAbs.status !== 'Active') {
        throw new Error('Chi duoc cap nhat dang ky tam vang dang hoat dong');
      }

      const request = pool.request();
      request.input('tempAbsId', sql.Int, tempAbsId);

      let updateFields = [];

      if (tempAbsData.destination_address !== undefined) {
        request.input('destination_address', sql.NVarChar, tempAbsData.destination_address);
        updateFields.push('destination_address = @destination_address');
      }
      if (tempAbsData.destination_ward_code !== undefined) {
        request.input('destination_ward_code', sql.NVarChar, tempAbsData.destination_ward_code);
        updateFields.push('destination_ward_code = @destination_ward_code');
      }
      if (tempAbsData.reason !== undefined) {
        request.input('reason', sql.NVarChar, tempAbsData.reason);
        updateFields.push('reason = @reason');
      }
      if (tempAbsData.notes !== undefined) {
        request.input('notes', sql.NVarChar, tempAbsData.notes);
        updateFields.push('notes = @notes');
      }

      if (updateFields.length === 0) {
        return await this.getTemporaryAbsenceById(tempAbsId);
      }

      updateFields.push('updated_at = GETDATE()');

      const updateQuery = `
        UPDATE TemporaryAbsences
        SET ${updateFields.join(', ')}
        WHERE temp_absence_id = @tempAbsId
      `;

      await request.query(updateQuery);
      logger.info(`Temporary absence updated: ${tempAbsId}`);

      return await this.getTemporaryAbsenceById(tempAbsId);
    } catch (error) {
      logger.error('Update temporary absence failed:', error);
      throw error;
    }
  }

  /**
   * Gia han tam vang
   */
  async extendTemporaryAbsence(tempAbsId, newExpectedReturnDate) {
    try {
      const pool = await getConnection();

      // Kiem tra tam vang co ton tai khong
      const tempAbs = await this.getTemporaryAbsenceById(tempAbsId);
      if (!tempAbs) {
        throw new Error('Khong tim thay dang ky tam vang');
      }

      if (tempAbs.status !== 'Active') {
        throw new Error('Chi duoc gia han dang ky tam vang dang hoat dong');
      }

      // Kiem tra thoi gian gia han hop le
      const currentExpectedDate = new Date(tempAbs.expected_return_date);
      const extendedDate = new Date(newExpectedReturnDate);

      if (extendedDate <= currentExpectedDate) {
        throw new Error('Ngay du kien ve moi phai sau ngay hien tai');
      }

      const startDate = new Date(tempAbs.start_date);
      const monthsDiff = (extendedDate - startDate) / (1000 * 60 * 60 * 24 * 30);

      if (monthsDiff > 12) {
        throw new Error('Tong thoi gian tam vang khong duoc vuot qua 12 thang');
      }

      // Gia han va doi trang thai thanh Extended
      await pool
        .request()
        .input('tempAbsId', sql.Int, tempAbsId)
        .input('newExpectedDate', sql.Date, newExpectedReturnDate)
        .query(`
          UPDATE TemporaryAbsences
          SET
            expected_return_date = @newExpectedDate,
            status = 'Extended',
            updated_at = GETDATE()
          WHERE temp_absence_id = @tempAbsId
        `);

      logger.info(`Temporary absence extended: ${tempAbsId}`);

      return await this.getTemporaryAbsenceById(tempAbsId);
    } catch (error) {
      logger.error('Extend temporary absence failed:', error);
      throw error;
    }
  }

  /**
   * Danh dau da ve
   */
  async markAsReturned(tempAbsId, actualReturnDate = null) {
    const pool = await getConnection();
    const transaction = pool.transaction();
    try {
      await transaction.begin();

      const tempAbsResult = await transaction.request()
        .input('tempAbsId', sql.Int, tempAbsId)
        .query('SELECT citizen_id, start_date, status FROM TemporaryAbsences WHERE temp_absence_id = @tempAbsId');

      if (tempAbsResult.recordset.length === 0) throw new Error('Khong tim thay dang ky tam vang');
      const tempAbs = tempAbsResult.recordset[0];
      if (tempAbs.status === 'Returned') throw new Error('Dang ky tam vang da duoc danh dau la da ve');

      const returnDate = actualReturnDate || new Date().toISOString().split('T')[0];

      // Đánh dấu đã về trên phiếu
      await transaction.request()
        .input('tempAbsId', sql.Int, tempAbsId)
        .input('actualReturnDate', sql.Date, returnDate)
        .query(`
          UPDATE TemporaryAbsences 
          SET actual_return_date = @actualReturnDate, status = 'Returned', updated_at = GETDATE()
          WHERE temp_absence_id = @tempAbsId
        `);

      // === LIÊN THÔNG DỮ LIỆU: TRẢ LẠI TRẠNG THÁI 'Active' ===
      await transaction.request()
        .input('citizenId', sql.Int, tempAbs.citizen_id)
        .query(`UPDATE Citizens SET status = 'Active', updated_at = GETDATE() WHERE citizen_id = @citizenId`);

      await transaction.commit();
      logger.info(`Temporary absence marked as returned: ${tempAbsId}`);

      return await this.getTemporaryAbsenceById(tempAbsId);
    } catch (error) {
      if (transaction) await transaction.rollback();
      logger.error('Mark as returned failed:', error);
      throw error;
    }
  }

  /**
   * Lay danh sach tam vang sap het han
   */
  async getExpiringAbsences(daysBeforeExpiry = 30, wardId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input('daysBeforeExpiry', sql.Int, daysBeforeExpiry);

      let whereConditions = [
        "ta.status IN ('Active', 'Extended')",
        'ta.expected_return_date >= CAST(GETDATE() AS DATE)',
        'DATEDIFF(DAY, GETDATE(), ta.expected_return_date) <= @daysBeforeExpiry'
      ];

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        whereConditions.push('c.ward_id = @wardId');
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      const query = `
        SELECT
          ta.temp_absence_id,
          c.citizen_code,
          c.full_name,
          c.phone,
          ta.destination_address,
          ta.expected_return_date,
          DATEDIFF(DAY, GETDATE(), ta.expected_return_date) as days_until_return
        FROM TemporaryAbsences ta
        INNER JOIN Citizens c ON ta.citizen_id = c.citizen_id
        ${whereClause}
        ORDER BY ta.expected_return_date
      `;

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error('Get expiring absences failed:', error);
      throw error;
    }
  }

  /**
   * Thong ke tam vang
   */
  async getStats(wardId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      let joinClause = '';
      let whereClause = '';

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        joinClause = 'INNER JOIN Citizens c ON ta.citizen_id = c.citizen_id';
        whereClause = 'WHERE c.ward_id = @wardId';
      }

      const query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN ta.status = 'Active' THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN ta.status = 'Extended' THEN 1 ELSE 0 END) as extended_count,
          SUM(CASE WHEN ta.status = 'Returned' THEN 1 ELSE 0 END) as returned_count,
          SUM(CASE WHEN DATEDIFF(DAY, GETDATE(), ta.expected_return_date) <= 30
              AND ta.status IN ('Active', 'Extended') THEN 1 ELSE 0 END) as returning_soon
        FROM TemporaryAbsences ta
        ${joinClause}
        ${whereClause}
      `;

      const result = await request.query(query);
      return result.recordset[0];
    } catch (error) {
      logger.error('Get temp absence stats failed:', error);
      throw error;
    }
  }
}

module.exports = new TemporaryAbsenceService();