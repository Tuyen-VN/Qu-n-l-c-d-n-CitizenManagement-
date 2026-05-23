const { getConnection, sql } = require('../config/database');
const logger = require('../utils/logger');

class BirthCertificateService {

  // ─────────────────────────────────────────────
  // Helper: sinh citizen_code 12 chữ số duy nhất
  // ─────────────────────────────────────────────
  async _generateCitizenCode(transaction) {
    const result = await transaction
      .request()
      .query(`
        SELECT ISNULL(MAX(CAST(citizen_code AS BIGINT)), 0) + 1 AS next_code
        FROM Citizens
        WHERE LEN(citizen_code) = 12 AND ISNUMERIC(citizen_code) = 1
      `);
    const code = String(result.recordset[0].next_code).padStart(12, '0');
    return code;
  }

  // ─────────────────────────────────────────────
  // Helper: sinh certificate_number KS-YYYYMM-NNNNN
  // ─────────────────────────────────────────────
  async _generateCertNumber(transaction) {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const countResult = await transaction.request().query(`
      SELECT COUNT(*) AS count
      FROM BirthCertificates
      WHERE YEAR(registration_date) = YEAR(GETDATE())
        AND MONTH(registration_date) = MONTH(GETDATE())
    `);
    return `KS-${yearMonth}-${String(countResult.recordset[0].count + 1).padStart(5, '0')}`;
  }

  /**
   * Lấy danh sách giấy khai sinh (giữ nguyên)
   */
  async getBirthCertificates(filters = {}) {
    try {
      const pool = await getConnection();
      const {
        page = 1, pageSize = 20,
        searchTerm = null, wardId = null,
        startDate = null, endDate = null,
      } = filters;

      const offset = (page - 1) * pageSize;
      const request = pool.request();
      request.input('pageSize', sql.Int, parseInt(pageSize));
      request.input('offset', sql.Int, offset);

      const conditions = [];
      if (searchTerm) {
        request.input('searchTerm', sql.NVarChar, `%${searchTerm}%`);
        conditions.push('(bc.certificate_number LIKE @searchTerm OR child.full_name LIKE @searchTerm OR child.citizen_code LIKE @searchTerm)');
      }
      if (wardId) {
        request.input('wardId', sql.Int, wardId);
        conditions.push('child.ward_id = @wardId');
      }
      if (startDate) {
        request.input('startDate', sql.Date, startDate);
        conditions.push('bc.registration_date >= @startDate');
      }
      if (endDate) {
        request.input('endDate', sql.Date, endDate);
        conditions.push('bc.registration_date <= @endDate');
      }

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

      const countResult = await request.query(`
        SELECT COUNT(*) AS total
        FROM BirthCertificates bc
        INNER JOIN Citizens child ON bc.child_citizen_id = child.citizen_id
        ${where}
      `);

      const dataResult = await request.query(`
        SELECT
          bc.birth_cert_id, bc.certificate_number, bc.registration_date,
          child.citizen_id AS child_id, child.citizen_code AS child_citizen_code,
          child.full_name AS child_name, child.date_of_birth AS child_dob,
          child.gender AS child_gender,
          father.full_name AS father_name,
          mother.full_name AS mother_name,
          bc.birth_place, bc.created_at
        FROM BirthCertificates bc
        INNER JOIN Citizens child ON bc.child_citizen_id = child.citizen_id
        LEFT JOIN Citizens father ON bc.father_citizen_id = father.citizen_id
        LEFT JOIN Citizens mother ON bc.mother_citizen_id = mother.citizen_id
        ${where}
        ORDER BY bc.registration_date DESC, bc.created_at DESC
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
      `);

      return {
        data: dataResult.recordset,
        totalCount: countResult.recordset[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      };
    } catch (error) {
      logger.error('Get birth certificates failed:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết theo ID (giữ nguyên)
   */
  async getBirthCertificateById(certId) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('certId', sql.Int, certId)
        .query(`
          SELECT
            bc.*,
            child.citizen_id AS child_id, child.citizen_code AS child_citizen_code,
            child.full_name AS child_name, child.date_of_birth AS child_dob,
            child.gender AS child_gender, child.ethnicity AS child_ethnicity,
            child.nationality AS child_nationality,
            father.citizen_id AS father_id, father.citizen_code AS father_citizen_code,
            father.full_name AS father_name, father.date_of_birth AS father_dob,
            mother.citizen_id AS mother_id, mother.citizen_code AS mother_citizen_code,
            mother.full_name AS mother_name, mother.date_of_birth AS mother_dob,
            w.ward_name, d.district_name, p.province_name
          FROM BirthCertificates bc
          INNER JOIN Citizens child ON bc.child_citizen_id = child.citizen_id
          LEFT JOIN Citizens father ON bc.father_citizen_id = father.citizen_id
          LEFT JOIN Citizens mother ON bc.mother_citizen_id = mother.citizen_id
          LEFT JOIN Wards w ON child.ward_id = w.ward_id
          LEFT JOIN Districts d ON w.district_id = d.district_id
          LEFT JOIN Provinces p ON d.province_id = p.province_id
          WHERE bc.birth_cert_id = @certId
        `);

      if (result.recordset.length === 0) throw new Error('Khong tim thay giay khai sinh');
      return result.recordset[0];
    } catch (error) {
      logger.error('Get birth certificate by id failed:', error);
      throw error;
    }
  }

  /**
   * Tìm theo số giấy (giữ nguyên)
   */
  async getBirthCertificateByNumber(certNumber) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('certNumber', sql.NVarChar, certNumber)
        .query(`SELECT birth_cert_id FROM BirthCertificates WHERE certificate_number = @certNumber`);

      if (result.recordset.length === 0) throw new Error('Khong tim thay giay khai sinh');
      return await this.getBirthCertificateById(result.recordset[0].birth_cert_id);
    } catch (error) {
      logger.error('Get birth certificate by number failed:', error);
      throw error;
    }
  }

  /**
   * ════════════════════════════════════════════════════════
   * TẠO GIẤY KHAI SINH – LUỒNG MỚI
   *
   * Nhận certData gồm:
   *   child_full_name, child_dob, child_gender  ← trẻ chưa tồn tại
   *   father_citizen_id?, mother_citizen_id?     ← tìm từ danh sách có sẵn
   *   birth_place?, registrar_name?, notes?
   *
   * Transaction:
   *   1. Kiểm tra cha/mẹ hợp lệ (nếu có)
   *   2. INSERT Citizens → lấy child_citizen_id + sinh citizen_code
   *   3. Sinh certificate_number
   *   4. INSERT BirthCertificates
   *   5. Thêm trẻ vào HouseholdMembers của cha/mẹ (nếu có)
   * ════════════════════════════════════════════════════════
   */
  async createBirthCertificate(certData, createdBy, wardId) {
    const pool = await getConnection();
    const transaction = pool.transaction();

    try {
      await transaction.begin();

      // ── 1. Phải có ít nhất cha hoặc mẹ ──────────────────────────
      if (!certData.father_citizen_id && !certData.mother_citizen_id) {
        throw new Error('Phai co it nhat cha hoac me');
      }

      // ── 2. Kiểm tra cha (nếu có) ─────────────────────────────────
      if (certData.father_citizen_id) {
        const fatherCheck = await transaction.request()
          .input('fatherId', sql.Int, certData.father_citizen_id)
          .query(`SELECT gender, status FROM Citizens WHERE citizen_id = @fatherId AND is_active = 1`);

        if (fatherCheck.recordset.length === 0) throw new Error('Cha khong ton tai');
        if (fatherCheck.recordset[0].gender !== 'Male') throw new Error('Cha phai la gioi tinh nam');
        if (fatherCheck.recordset[0].status === 'Deceased') throw new Error('Cha da mat');
      }

      // ── 3. Kiểm tra mẹ (nếu có) ──────────────────────────────────
      if (certData.mother_citizen_id) {
        const motherCheck = await transaction.request()
          .input('motherId', sql.Int, certData.mother_citizen_id)
          .query(`SELECT gender, status FROM Citizens WHERE citizen_id = @motherId AND is_active = 1`);

        if (motherCheck.recordset.length === 0) throw new Error('Me khong ton tai');
        if (motherCheck.recordset[0].gender !== 'Female') throw new Error('Me phai la gioi tinh nu');
        if (motherCheck.recordset[0].status === 'Deceased') throw new Error('Me da mat');
      }

      // ── 4. Sinh citizen_code và INSERT bản ghi Công dân mới ───────
      // ward_id lấy từ nhân viên đang thực hiện (wardId truyền từ controller)
      const citizenCode = await this._generateCitizenCode(transaction);

      const citizenInsert = await transaction.request()
        .input('citizen_code',  sql.NVarChar, citizenCode)
        .input('full_name',     sql.NVarChar, certData.child_full_name)
        .input('date_of_birth', sql.Date,     certData.child_dob)
        .input('gender',        sql.NVarChar, certData.child_gender)
        .input('ward_id',       sql.Int,      wardId || null)
        .input('status',        sql.NVarChar, 'Active')
        .input('is_active',     sql.Bit,      1)
        .input('created_by',    sql.Int,      createdBy)
        .query(`
          INSERT INTO Citizens (citizen_code, full_name, date_of_birth, gender, ward_id, status, is_active, created_by)
          OUTPUT INSERTED.citizen_id
          VALUES (@citizen_code, @full_name, @date_of_birth, @gender, @ward_id, @status, @is_active, @created_by)
        `);

      const childCitizenId = citizenInsert.recordset[0].citizen_id;

      // ── 5. Sinh certificate_number và INSERT BirthCertificates ────
      const certNumber = await this._generateCertNumber(transaction);

      const certInsert = await transaction.request()
        .input('certificate_number', sql.NVarChar, certNumber)
        .input('child_citizen_id',   sql.Int,      childCitizenId)
        .input('father_citizen_id',  sql.Int,      certData.father_citizen_id || null)
        .input('mother_citizen_id',  sql.Int,      certData.mother_citizen_id || null)
        .input('birth_place',        sql.NVarChar, certData.birth_place || null)
        .input('registrar_name',     sql.NVarChar, certData.registrar_name || null)
        .input('notes',              sql.NVarChar, certData.notes || null)
        .input('created_by',         sql.Int,      createdBy)
        .query(`
          INSERT INTO BirthCertificates
            (certificate_number, child_citizen_id, father_citizen_id, mother_citizen_id,
             birth_place, registrar_name, notes, created_by)
          OUTPUT INSERTED.birth_cert_id
          VALUES
            (@certificate_number, @child_citizen_id, @father_citizen_id, @mother_citizen_id,
             @birth_place, @registrar_name, @notes, @created_by)
        `);

      const certId = certInsert.recordset[0].birth_cert_id;

      // ── 6. Tự động thêm trẻ vào hộ khẩu cha/mẹ ──────────────────
      const parentId = certData.father_citizen_id || certData.mother_citizen_id;

      const householdCheck = await transaction.request()
        .input('parentId', sql.Int, parentId)
        .query(`
          SELECT household_id FROM HouseholdMembers
          WHERE citizen_id = @parentId AND is_current_member = 1
        `);

      if (householdCheck.recordset.length > 0) {
        await transaction.request()
          .input('householdId', sql.Int, householdCheck.recordset[0].household_id)
          .input('childId',     sql.Int, childCitizenId)
          .query(`
            INSERT INTO HouseholdMembers (household_id, citizen_id, relationship_to_head)
            VALUES (@householdId, @childId, 'Con')
          `);
      }

      await transaction.commit();
      logger.info(`Birth cert created: certId=${certId}, childCitizenId=${childCitizenId}, citizenCode=${citizenCode}, by user=${createdBy}`);

      return await this.getBirthCertificateById(certId);
    } catch (error) {
      await transaction.rollback();
      logger.error('Create birth certificate failed:', error);
      throw error;
    }
  }

  /**
   * Cập nhật giấy khai sinh (giữ nguyên)
   */
  async updateBirthCertificate(certId, certData) {
    try {
      const pool = await getConnection();
      await this.getBirthCertificateById(certId); // throws nếu không tìm thấy

      const request = pool.request();
      request.input('certId', sql.Int, certId);
      const fields = [];

      if (certData.birth_place !== undefined) {
        request.input('birth_place', sql.NVarChar, certData.birth_place);
        fields.push('birth_place = @birth_place');
      }
      if (certData.registrar_name !== undefined) {
        request.input('registrar_name', sql.NVarChar, certData.registrar_name);
        fields.push('registrar_name = @registrar_name');
      }
      if (certData.notes !== undefined) {
        request.input('notes', sql.NVarChar, certData.notes);
        fields.push('notes = @notes');
      }
      if (fields.length === 0) return await this.getBirthCertificateById(certId);

      fields.push('updated_at = GETDATE()');
      await request.query(`UPDATE BirthCertificates SET ${fields.join(', ')} WHERE birth_cert_id = @certId`);
      logger.info(`Birth certificate updated: ${certId}`);
      return await this.getBirthCertificateById(certId);
    } catch (error) {
      logger.error('Update birth certificate failed:', error);
      throw error;
    }
  }

  /**
   * Xóa giấy khai sinh (giữ nguyên)
   */
  async deleteBirthCertificate(certId) {
    try {
      const pool = await getConnection();
      await this.getBirthCertificateById(certId);
      await pool.request()
        .input('certId', sql.Int, certId)
        .query('DELETE FROM BirthCertificates WHERE birth_cert_id = @certId');
      logger.info(`Birth certificate deleted: ${certId}`);
    } catch (error) {
      logger.error('Delete birth certificate failed:', error);
      throw error;
    }
  }

  /**
   * Thống kê (giữ nguyên)
   */
  async getStatsByPeriod(year, month = null, wardId = null) {
    try {
      const pool = await getConnection();
      const request = pool.request();
      request.input('year', sql.Int, year);

      const conditions = ['YEAR(bc.registration_date) = @year'];
      if (month) { request.input('month', sql.Int, month); conditions.push('MONTH(bc.registration_date) = @month'); }
      if (wardId) { request.input('wardId', sql.Int, wardId); conditions.push('child.ward_id = @wardId'); }

      const result = await request.query(`
        SELECT
          COUNT(*) AS total_births,
          SUM(CASE WHEN child.gender = 'Male' THEN 1 ELSE 0 END) AS male_count,
          SUM(CASE WHEN child.gender = 'Female' THEN 1 ELSE 0 END) AS female_count,
          MONTH(bc.registration_date) AS month
        FROM BirthCertificates bc
        INNER JOIN Citizens child ON bc.child_citizen_id = child.citizen_id
        WHERE ${conditions.join(' AND ')}
        GROUP BY MONTH(bc.registration_date)
        ORDER BY MONTH(bc.registration_date)
      `);
      return result.recordset;
    } catch (error) {
      logger.error('Get birth stats failed:', error);
      throw error;
    }
  }
}

module.exports = new BirthCertificateService();