const { getConnection, sql } = require('../config/database');
const logger = require('../utils/logger');

class CitizenService {
  /**
   * Lay danh sach cong dan (co phan trang va tim kiem)
   */
  async getCitizens(filters = {}) {
    try {
      const pool = await getConnection();
      const {
        page = 1,
        pageSize = 20,
        searchTerm = null,
        wardId = null,
        gender = null,
        minAge = null,
        maxAge = null,
        status = 'null',
      } = filters;

      const offset = (page - 1) * pageSize;

      const request = pool.request();
      request.input('pageSize', sql.Int, parseInt(pageSize));
      request.input('offset', sql.Int, offset);

      let whereConditions = ['c.is_active = 1'];

      if (searchTerm) {
        request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
        whereConditions.push(
          '(c.full_name LIKE @searchTerm OR c.citizen_code LIKE @searchTerm)'
        );
      }

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        whereConditions.push('c.ward_id = @wardId');
      }

      if (gender) {
        request.input('gender', sql.NVarChar, gender);
        whereConditions.push('c.gender = @gender');
      }

      if (status && status !== 'null') {
        request.input('status', sql.NVarChar, status);
        whereConditions.push('c.status = @status');
      }

      const whereClause = whereConditions.join(' AND ');

      // Lay tong so ban ghi
      const countQuery = `
        SELECT COUNT(*) as total
        FROM Citizens c
        WHERE ${whereClause}
      `;

      const countResult = await request.query(countQuery);
      const totalCount = countResult.recordset[0].total;

      // Lay du lieu
      const dataQuery = `
        SELECT
          c.citizen_id,
          c.citizen_code,
          c.full_name,
          c.date_of_birth,
          DATEDIFF(YEAR, c.date_of_birth, GETDATE()) as age,
          c.gender,
          c.phone,
          c.email,
          c.permanent_address,
          c.status,
          w.ward_name,
          d.district_name,
          p.province_name,
          c.created_at
        FROM Citizens c
        INNER JOIN Wards w ON c.ward_id = w.ward_id
        INNER JOIN Districts d ON w.district_id = d.district_id
        INNER JOIN Provinces p ON d.province_id = p.province_id
        WHERE ${whereClause}
        ORDER BY c.created_at DESC
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
      logger.error('Get citizens failed:', error);
      throw error;
    }
  }

  /**
   * Lay thong tin chi tiet cong dan
   */
  async getCitizenById(citizenId) {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input('citizenId', sql.Int, citizenId)
        .query(`
          SELECT
            c.*,
            w.ward_name,
            w.ward_code,
            d.district_name,
            d.district_code,
            p.province_name,
            p.province_code,
            h.household_code,
            h.address as household_address,
            hm.relationship_to_head
          FROM Citizens c
          INNER JOIN Wards w ON c.ward_id = w.ward_id
          INNER JOIN Districts d ON w.district_id = d.district_id
          INNER JOIN Provinces p ON d.province_id = p.province_id
          LEFT JOIN HouseholdMembers hm ON c.citizen_id = hm.citizen_id
            AND hm.is_current_member = 1
          LEFT JOIN Households h ON hm.household_id = h.household_id
          WHERE c.citizen_id = @citizenId
        `);

      if (result.recordset.length === 0) {
        throw new Error('Khong tim thay cong dan');
      }

      return result.recordset[0];
    } catch (error) {
      logger.error('Get citizen by id failed:', error);
      throw error;
    }
  }

  /**
   * Kiem tra CCCD da ton tai chua
   */
  async checkCitizenCodeExists(citizenCode, excludeId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      request.input('citizenCode', sql.NVarChar, citizenCode);

      let query = 'SELECT citizen_id FROM Citizens WHERE citizen_code = @citizenCode';

      if (excludeId) {
        request.input('excludeId', sql.Int, excludeId);
        query += ' AND citizen_id != @excludeId';
      }

      const result = await request.query(query);
      return result.recordset.length > 0;
    } catch (error) {
      logger.error('Check citizen code exists failed:', error);
      throw error;
    }
  }

  /**
   * Them cong dan moi
   */
  async createCitizen(citizenData, createdBy) {
    try {
      const pool = await getConnection();

      // DEBUG: Log gender value
      logger.info(`Creating citizen - Gender value: "${citizenData.gender}" (length: ${citizenData.gender?.length})`);

      // Kiem tra CCCD da ton tai chua
      const exists = await this.checkCitizenCodeExists(citizenData.citizen_code);
      if (exists) {
        throw new Error('CCCD da ton tai trong he thong');
      }

      const result = await pool
        .request()
        .input('citizen_code', sql.NVarChar, citizenData.citizen_code)
        .input('full_name', sql.NVarChar, citizenData.full_name)
        .input('date_of_birth', sql.Date, citizenData.date_of_birth)
        .input('gender', sql.NVarChar, citizenData.gender)
        .input('place_of_birth', sql.NVarChar, citizenData.place_of_birth || null)
        .input('ethnicity', sql.NVarChar, citizenData.ethnicity || 'Kinh')
        .input('occupation', sql.NVarChar, citizenData.occupation || null)
        .input('phone', sql.NVarChar, citizenData.phone || null)
        .input('email', sql.NVarChar, citizenData.email || null)
        .input('permanent_address', sql.NVarChar, citizenData.permanent_address)
        .input('ward_id', sql.Int, citizenData.ward_id)
        .input('created_by', sql.Int, createdBy)
        .query(`
          INSERT INTO Citizens (
            citizen_code, full_name, date_of_birth, gender, place_of_birth,
            ethnicity, occupation, phone, email, permanent_address, ward_id, created_by
          )
          OUTPUT INSERTED.citizen_id
          VALUES (
            @citizen_code, @full_name, @date_of_birth, @gender, @place_of_birth,
            @ethnicity, @occupation, @phone, @email, @permanent_address, @ward_id, @created_by
          )
        `);

      const citizenId = result.recordset[0].citizen_id;
      logger.info(`Citizen created: ${citizenId} by user ${createdBy}`);

      return await this.getCitizenById(citizenId);
    } catch (error) {
      logger.error('Create citizen failed:', error);
      throw error;
    }
  }

  /**
   * Cap nhat thong tin cong dan
   */
  async updateCitizen(citizenId, citizenData) {
    try {
      const pool = await getConnection();

      // Kiem tra cong dan co ton tai khong
      const exists = await this.getCitizenById(citizenId);
      if (!exists) {
        throw new Error('Khong tim thay cong dan');
      }

      // Kiem tra CCCD trung (neu co thay doi)
      if (citizenData.citizen_code) {
        const codeExists = await this.checkCitizenCodeExists(
          citizenData.citizen_code,
          citizenId
        );
        if (codeExists) {
          throw new Error('CCCD da ton tai trong he thong');
        }
      }

      const request = pool.request();
      request.input('citizenId', sql.Int, citizenId);

      let updateFields = [];

      if (citizenData.citizen_code) {
        request.input('citizen_code', sql.NVarChar, citizenData.citizen_code);
        updateFields.push('citizen_code = @citizen_code');
      }
      if (citizenData.full_name) {
        request.input('full_name', sql.NVarChar, citizenData.full_name);
        updateFields.push('full_name = @full_name');
      }
      if (citizenData.date_of_birth) {
        request.input('date_of_birth', sql.Date, citizenData.date_of_birth);
        updateFields.push('date_of_birth = @date_of_birth');
      }
      if (citizenData.gender) {
        request.input('gender', sql.NVarChar, citizenData.gender);
        updateFields.push('gender = @gender');
      }
      if (citizenData.phone !== undefined) {
        request.input('phone', sql.NVarChar, citizenData.phone);
        updateFields.push('phone = @phone');
      }
      if (citizenData.email !== undefined) {
        request.input('email', sql.NVarChar, citizenData.email);
        updateFields.push('email = @email');
      }
      if (citizenData.occupation !== undefined) {
        request.input('occupation', sql.NVarChar, citizenData.occupation);
        updateFields.push('occupation = @occupation');
      }
      if (citizenData.permanent_address) {
        request.input('permanent_address', sql.NVarChar, citizenData.permanent_address);
        updateFields.push('permanent_address = @permanent_address');
      }

      if (citizenData.status !== undefined) {
        request.input('status', sql.NVarChar, citizenData.status);
        updateFields.push('status = @status');
      }

      updateFields.push('updated_at = GETDATE()');

      const updateQuery = `
        UPDATE Citizens
        SET ${updateFields.join(', ')}
        WHERE citizen_id = @citizenId
      `;

      await request.query(updateQuery);
      logger.info(`Citizen updated: ${citizenId}`);

      return await this.getCitizenById(citizenId);
    } catch (error) {
      logger.error('Update citizen failed:', error);
      throw error;
    }
  }

  /**
   * Xoa cong dan (soft delete)
   */
  async deleteCitizen(citizenId) {
    try {
      const pool = await getConnection();

      // Kiem tra cong dan co ton tai khong
      const citizen = await this.getCitizenById(citizenId);
      if (!citizen) {
        throw new Error('Khong tim thay cong dan');
      }

      // Kiem tra co giay khai sinh/khai tu khong
      const checkResult = await pool
        .request()
        .input('citizenId', sql.Int, citizenId)
        .query(`
          SELECT
            (SELECT COUNT(*) FROM BirthCertificates WHERE child_citizen_id = @citizenId) as birth_count,
            (SELECT COUNT(*) FROM DeathCertificates WHERE citizen_id = @citizenId) as death_count
        `);

      const { birth_count, death_count } = checkResult.recordset[0];

      if (birth_count > 0 || death_count > 0) {
        throw new Error(
          'Khong the xoa cong dan da co giay khai sinh hoac khai tu'
        );
      }

      // Soft delete
      await pool
        .request()
        .input('citizenId', sql.Int, citizenId)
        .query(`
          UPDATE Citizens
          SET is_active = 0, status = 'Inactive', updated_at = GETDATE()
          WHERE citizen_id = @citizenId
        `);

      // Xoa khoi ho khau (neu co)
      await pool
        .request()
        .input('citizenId', sql.Int, citizenId)
        .query(`
          UPDATE HouseholdMembers
          SET is_current_member = 0, leave_date = CAST(GETDATE() AS DATE), updated_at = GETDATE()
          WHERE citizen_id = @citizenId AND is_current_member = 1
        `);

      logger.info(`Citizen soft deleted: ${citizenId}`);
    } catch (error) {
      logger.error('Delete citizen failed:', error);
      throw error;
    }
  }

  /**
   * Thong ke cong dan theo gioi tinh
   */
  async getStatsByGender(wardId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      let query = `
        SELECT
          gender,
          COUNT(*) as count
        FROM Citizens
        WHERE is_active = 1 AND status IN ('Active', 'Absent')
      `;

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        query += ' AND ward_id = @wardId';
      }

      query += ' GROUP BY gender';

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error('Get stats by gender failed:', error);
      throw error;
    }
  }

  /**
   * Thong ke cong dan theo do tuoi
   */
  async getStatsByAgeGroup(wardId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();

      let query = `
        SELECT
          age_group,
          COUNT(*) as count,
          SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as male_count,
          SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as female_count
        FROM (
          SELECT
            gender,
            CASE
              WHEN DATEDIFF(YEAR, date_of_birth, GETDATE()) < 6 THEN '0-5'
              WHEN DATEDIFF(YEAR, date_of_birth, GETDATE()) BETWEEN 6 AND 14 THEN '6-14'
              WHEN DATEDIFF(YEAR, date_of_birth, GETDATE()) BETWEEN 15 AND 24 THEN '15-24'
              WHEN DATEDIFF(YEAR, date_of_birth, GETDATE()) BETWEEN 25 AND 54 THEN '25-54'
              WHEN DATEDIFF(YEAR, date_of_birth, GETDATE()) BETWEEN 55 AND 64 THEN '55-64'
              ELSE '65+'
            END as age_group
          FROM Citizens
          WHERE is_active = 1 AND status IN ('Active', 'Absent')
      `;

      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        query += ' AND ward_id = @wardId';
      }

      query += `
        ) as AgeData
        GROUP BY age_group
        ORDER BY
          CASE age_group
            WHEN '0-5' THEN 1
            WHEN '6-14' THEN 2
            WHEN '15-24' THEN 3
            WHEN '25-54' THEN 4
            WHEN '55-64' THEN 5
            WHEN '65+' THEN 6
          END
      `;

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error('Get stats by age group failed:', error);
      throw error;
    }
  }
}

module.exports = new CitizenService();