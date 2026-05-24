const { getConnection, sql } = require('../config/database');
const logger = require('../utils/logger');

class DeathCertificateService {
  /**
   * Lay danh sach giay khai tu
   */
  async getDeathCertificates(filters = {}) {
    try {
      const pool = await getConnection();
      const {
        page = 1,
        pageSize = 20,
        searchTerm = null,
        wardId = null,
        startDate = null,
        endDate = null,
      } = filters;

      const offset = (page - 1) * pageSize;
      const request = pool.request();

      request.input('pageSize', sql.Int, parseInt(pageSize));
      request.input('offset', sql.Int, offset);

      let whereConditions = [];

      if (searchTerm) {
        request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
        whereConditions.push(
          '(dc.certificate_number LIKE @searchTerm OR c.full_name LIKE @searchTerm OR c.citizen_code LIKE @searchTerm)'
        );
      }

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        whereConditions.push('c.ward_id = @wardId');
      }

      if (startDate) {
        request.input('startDate', sql.Date, startDate);
        whereConditions.push('dc.date_of_death >= @startDate');
      }

      if (endDate) {
        request.input('endDate', sql.Date, endDate);
        whereConditions.push('dc.date_of_death <= @endDate');
      }

      const whereClause = whereConditions.length > 0
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM DeathCertificates dc
        INNER JOIN Citizens c ON dc.citizen_id = c.citizen_id
        ${whereClause}
      `;

      const countResult = await request.query(countQuery);
      const totalCount = countResult.recordset[0].total;

      // Data query
      const dataQuery = `
        SELECT
          dc.death_cert_id,
          dc.certificate_number,
          dc.date_of_death,
          dc.registration_date,
          c.citizen_id,
          c.citizen_code,
          c.full_name,
          c.date_of_birth,
          DATEDIFF(YEAR, c.date_of_birth, dc.date_of_death) as age_at_death,
          c.gender,
          dc.cause_of_death,
          dc.place_of_death,
          dc.registrar_name,
          dc.created_at
        FROM DeathCertificates dc
        INNER JOIN Citizens c ON dc.citizen_id = c.citizen_id
        ${whereClause}
        ORDER BY dc.date_of_death DESC, dc.created_at DESC
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
      logger.error('Get death certificates failed:', error);
      throw error;
    }
  }

  /**
   * Lay chi tiet giay khai tu
   */
  async getDeathCertificateById(certId) {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input('certId', sql.Int, certId)
        .query(`
          SELECT
            dc.*,
            c.citizen_id,
            c.citizen_code,
            c.full_name,
            c.date_of_birth,
            DATEDIFF(YEAR, c.date_of_birth, dc.date_of_death) as age_at_death,
            c.gender,
            c.ethnicity,
            c.permanent_address,
            w.ward_name,
            d.district_name,
            p.province_name
          FROM DeathCertificates dc
          INNER JOIN Citizens c ON dc.citizen_id = c.citizen_id
          LEFT JOIN Wards w ON c.ward_id = w.ward_id
          LEFT JOIN Districts d ON w.district_id = d.district_id
          LEFT JOIN Provinces p ON d.province_id = p.province_id
          WHERE dc.death_cert_id = @certId
        `);

      if (result.recordset.length === 0) {
        throw new Error('Khong tim thay giay khai tu');
      }

      return result.recordset[0];
    } catch (error) {
      logger.error('Get death certificate by id failed:', error);
      throw error;
    }
  }

  /**
   * Tim giay khai tu theo so
   */
  async getDeathCertificateByNumber(certNumber) {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input('certNumber', sql.NVarChar, certNumber)
        .query(`
          SELECT dc.death_cert_id
          FROM DeathCertificates dc
          WHERE dc.certificate_number = @certNumber
        `);

      if (result.recordset.length === 0) {
        throw new Error('Khong tim thay giay khai tu');
      }

      return await this.getDeathCertificateById(result.recordset[0].death_cert_id);
    } catch (error) {
      logger.error('Get death certificate by number failed:', error);
      throw error;
    }
  }

  /**
   * Tao giay khai tu
   */
  async createDeathCertificate(certData, createdBy) {
    const pool = await getConnection();
    const transaction = pool.transaction();
    let certId;

    try {
      await transaction.begin();

      // Kiem tra nguoi mat da co giay khai tu chua
      const existingCert = await transaction
        .request()
        .input('citizenId', sql.Int, certData.citizen_id)
        .query('SELECT death_cert_id FROM DeathCertificates WHERE citizen_id = @citizenId');

      if (existingCert.recordset.length > 0) {
        throw new Error('Nguoi nay da co giay khai tu');
      }

      // Kiem tra cong dan co ton tai va hop le khong
      const citizenCheck = await transaction
        .request()
        .input('citizenId', sql.Int, certData.citizen_id)
        .query(`
          SELECT
            citizen_id,
            full_name,
            date_of_birth,
            status
          FROM Citizens
          WHERE citizen_id = @citizenId AND is_active = 1
        `);

      if (citizenCheck.recordset.length === 0) {
        throw new Error('Cong dan khong ton tai trong he thong');
      }

      const citizen = citizenCheck.recordset[0];

      if (citizen.status === 'Deceased') {
        throw new Error('Cong dan da duoc xac nhan tu vong truoc do');
      }

      // Kiem tra ngay tu vong hop le
      const dateOfDeath = new Date(certData.date_of_death);
      const dateOfBirth = new Date(citizen.date_of_birth);
      const today = new Date();

      if (dateOfDeath > today) {
        throw new Error('Ngay tu vong khong the lon hon ngay hom nay');
      }

      if (dateOfDeath < dateOfBirth) {
        throw new Error('Ngay tu vong khong the truoc ngay sinh');
      }

      // Kiem tra thoi han khai tu (7 ngay)
      const daysFromDeath = Math.floor((today - dateOfDeath) / (1000 * 60 * 60 * 24));
      if (daysFromDeath > 7) {
        logger.warn(`Death registration is late: ${daysFromDeath} days from death`);
        // Chi canh bao, van cho phep dang ky
      }

      // Tao so giay khai tu tu dong
      const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
      const countResult = await transaction
        .request()
        .query(`
          SELECT COUNT(*) as count
          FROM DeathCertificates
          WHERE YEAR(registration_date) = YEAR(GETDATE())
            AND MONTH(registration_date) = MONTH(GETDATE())
        `);

      const certNumber = `KT-${yearMonth}-${String(countResult.recordset[0].count + 1).padStart(5, '0')}`;

      // Tao giay khai tu
      const insertResult = await transaction
        .request()
        .input('certificate_number', sql.NVarChar, certNumber)
        .input('citizen_id', sql.Int, certData.citizen_id)
        .input('date_of_death', sql.Date, certData.date_of_death)
        .input('place_of_death', sql.NVarChar, certData.place_of_death || null)
        .input('cause_of_death', sql.NVarChar, certData.cause_of_death || null)
        .input('burial_place', sql.NVarChar, certData.burial_place || null)
        .input('registrar_name', sql.NVarChar, certData.registrar_name || null)
        .input('notes', sql.NVarChar, certData.notes || null)
        .input('created_by', sql.Int, createdBy)
        .query(`
          INSERT INTO DeathCertificates (
            certificate_number, citizen_id, date_of_death, place_of_death,
            cause_of_death, burial_place, registrar_name, notes, created_by
          )
          VALUES (
            @certificate_number, @citizen_id, @date_of_death, @place_of_death,
            @cause_of_death, @burial_place, @registrar_name, @notes, @created_by
          );
          SELECT SCOPE_IDENTITY() AS death_cert_id;
        `);

      certId = insertResult.recordset[0].death_cert_id; 
      
      // Cap nhat trang thai cong dan thanh Deceased
      // (Trigger tu dong xu ly viec nay, nhung ta lam thu cong de dam bao)
      await transaction
        .request()
        .input('citizenId', sql.Int, certData.citizen_id)
        .query(`
          UPDATE Citizens
          SET status = 'Deceased', is_active = 0, updated_at = GETDATE()
          WHERE citizen_id = @citizenId
        `);

      // Loai khoi ho khau (danh dau khong con la thanh vien hien tai)
      await transaction
        .request()
        .input('citizenId', sql.Int, certData.citizen_id)
        .input('leaveDate', sql.Date, certData.date_of_death)
        .query(`
          UPDATE HouseholdMembers
          SET
            is_current_member = 0,
            leave_date = @leaveDate,
            updated_at = GETDATE()
          WHERE citizen_id = @citizenId AND is_current_member = 1
        `);

      await transaction.commit();
      logger.info(`Death certificate created: ${certId} by user ${createdBy}`);

      
    } catch (error) {
      await transaction.rollback();
      logger.error('Create death certificate failed:', error);
      throw error;
    }
    return await this.getDeathCertificateById(certId);
  }

  /**
   * Cap nhat giay khai tu
   */
  async updateDeathCertificate(certId, certData) {
    try {
      const pool = await getConnection();

      // Kiem tra giay khai tu co ton tai khong
      const cert = await this.getDeathCertificateById(certId);
      if (!cert) {
        throw new Error('Khong tim thay giay khai tu');
      }

      const request = pool.request();
      request.input('certId', sql.Int, certId);

      let updateFields = [];

      if (certData.place_of_death !== undefined) {
        request.input('place_of_death', sql.NVarChar, certData.place_of_death);
        updateFields.push('place_of_death = @place_of_death');
      }
      if (certData.cause_of_death !== undefined) {
        request.input('cause_of_death', sql.NVarChar, certData.cause_of_death);
        updateFields.push('cause_of_death = @cause_of_death');
      }
      if (certData.burial_place !== undefined) {
        request.input('burial_place', sql.NVarChar, certData.burial_place);
        updateFields.push('burial_place = @burial_place');
      }
      if (certData.registrar_name !== undefined) {
        request.input('registrar_name', sql.NVarChar, certData.registrar_name);
        updateFields.push('registrar_name = @registrar_name');
      }
      if (certData.notes !== undefined) {
        request.input('notes', sql.NVarChar, certData.notes);
        updateFields.push('notes = @notes');
      }

      if (updateFields.length === 0) {
        return await this.getDeathCertificateById(certId);
      }

      updateFields.push('updated_at = GETDATE()');

      const updateQuery = `
        UPDATE DeathCertificates
        SET ${updateFields.join(', ')}
        WHERE death_cert_id = @certId
      `;

      await request.query(updateQuery);
      logger.info(`Death certificate updated: ${certId}`);

      return await this.getDeathCertificateById(certId);
    } catch (error) {
      logger.error('Update death certificate failed:', error);
      throw error;
    }
  }

  /**
   * Xoa giay khai tu (chi Admin, rat khong nen su dung)
   */
  async deleteDeathCertificate(certId) {
    const pool = await getConnection();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // Kiem tra giay khai tu co ton tai khong
      const cert = await this.getDeathCertificateById(certId);
      if (!cert) {
        throw new Error('Khong tim thay giay khai tu');
      }

      // Xoa giay khai tu
      await transaction
        .request()
        .input('certId', sql.Int, certId)
        .query('DELETE FROM DeathCertificates WHERE death_cert_id = @certId');

      // Khoi phuc trang thai cong dan (neu can)
      await transaction
        .request()
        .input('citizenId', sql.Int, cert.citizen_id)
        .query(`
          UPDATE Citizens
          SET status = 'Active', is_active = 1, updated_at = GETDATE()
          WHERE citizen_id = @citizenId
        `);

      await transaction.commit();
      logger.warn(`Death certificate deleted: ${certId} - Citizen status restored`);
    } catch (error) {
      await transaction.rollback();
      logger.error('Delete death certificate failed:', error);
      throw error;
    }
  }

  /**
   * Thong ke khai tu theo thang/nam
   */
  async getStatsByPeriod(year, month = null, wardId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input('year', sql.Int, year);

      let whereConditions = ['YEAR(dc.date_of_death) = @year'];

      if (month) {
        request.input('month', sql.Int, month);
        whereConditions.push('MONTH(dc.date_of_death) = @month');
      }

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        whereConditions.push('c.ward_id = @wardId');
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      const query = `
        SELECT
          COUNT(*) as total_deaths,
          SUM(CASE WHEN c.gender = 'Male' THEN 1 ELSE 0 END) as male_count,
          SUM(CASE WHEN c.gender = 'Female' THEN 1 ELSE 0 END) as female_count,
          AVG(DATEDIFF(YEAR, c.date_of_birth, dc.date_of_death)) as avg_age_at_death,
          MONTH(dc.date_of_death) as month
        FROM DeathCertificates dc
        INNER JOIN Citizens c ON dc.citizen_id = c.citizen_id
        ${whereClause}
        GROUP BY MONTH(dc.date_of_death)
        ORDER BY MONTH(dc.date_of_death)
      `;

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error('Get death stats failed:', error);
      throw error;
    }
  }
}

module.exports = new DeathCertificateService();