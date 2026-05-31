const { getConnection, sql } = require("../config/database");
const logger = require("../utils/logger");

class WardService {
  /**
   * Lay danh sach tat ca phuong/xa
   */
  async getAllWards() {
    try {
      const pool = await getConnection();

      const result = await pool.request().query(`
          SELECT
            w.ward_id,
            w.ward_code,
            w.ward_name,
            w.district_id,
            d.district_name,
            d.district_code,
            p.province_id,
            p.province_name,
            p.province_code,
            w.created_at,
            w.updated_at
          FROM Wards w
          INNER JOIN Districts d ON w.district_id = d.district_id
          INNER JOIN Provinces p ON d.province_id = p.province_id
          ORDER BY p.province_name, d.district_name, w.ward_name
        `);

      return result.recordset;
    } catch (error) {
      logger.error("Get all wards failed:", error);
      throw error;
    }
  }

  /**
   * Lay danh sach phuong/xa theo quan/huyen
   */
  async getWardsByDistrict(districtId) {
    try {
      const pool = await getConnection();

      const result = await pool
        .request()
        .input("districtId", sql.Int, districtId).query(`
          SELECT
            w.ward_id,
            w.ward_code,
            w.ward_name,
            w.district_id,
            d.district_name,
            d.district_code,
            p.province_id,
            p.province_name,
            p.province_code,
            w.created_at,
            w.updated_at
          FROM Wards w
          INNER JOIN Districts d ON w.district_id = d.district_id
          INNER JOIN Provinces p ON d.province_id = p.province_id
          WHERE w.district_id = @districtId
          ORDER BY w.ward_name
        `);

      return result.recordset;
    } catch (error) {
      logger.error("Get wards by district failed:", error);
      throw error;
    }
  }

  /**
   * Lay thong tin chi tiet phuong/xa
   */
  async getWardById(wardId) {
    try {
      const pool = await getConnection();

      const result = await pool.request().input("wardId", sql.Int, wardId)
        .query(`
          SELECT
            w.ward_id,
            w.ward_code,
            w.ward_name,
            w.district_id,
            d.district_name,
            d.district_code,
            p.province_id,
            p.province_name,
            p.province_code,
            w.created_at,
            w.updated_at
          FROM Wards w
          INNER JOIN Districts d ON w.district_id = d.district_id
          INNER JOIN Provinces p ON d.province_id = p.province_id
          WHERE w.ward_id = @wardId
        `);

      if (result.recordset.length === 0) {
        throw new Error("Khong tim thay phuong/xa");
      }

      return result.recordset[0];
    } catch (error) {
      logger.error("Get ward by id failed:", error);
      throw error;
    }
  }
}

module.exports = new WardService();
