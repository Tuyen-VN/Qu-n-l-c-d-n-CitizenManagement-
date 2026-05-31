const wardService = require("../services/ward.service");
const {
  successResponse,
  errorResponse,
  notFoundResponse,
} = require("../utils/response");
const logger = require("../utils/logger");

class WardController {
  /**
   * @route GET /api/wards
   * @desc Lay danh sach tat ca phuong/xa
   * @access Private (Admin, Staff, Viewer)
   */
  async getAllWards(req, res) {
    try {
      const wards = await wardService.getAllWards();

      return successResponse(
        res,
        wards,
        "Lay danh sach phuong/xa thanh cong",
        200
      );
    } catch (error) {
      logger.error("Get all wards controller error:", error);
      return errorResponse(
        res,
        "GET_WARDS_FAILED",
        "Lay danh sach phuong/xa that bai",
        500
      );
    }
  }

  /**
   * @route GET /api/wards/district/:districtId
   * @desc Lay danh sach phuong/xa theo quan/huyen
   * @access Private (Admin, Staff, Viewer)
   */
  async getWardsByDistrict(req, res) {
    try {
      const { districtId } = req.params;
      const wards = await wardService.getWardsByDistrict(districtId);

      return successResponse(
        res,
        wards,
        "Lay danh sach phuong/xa theo quan/huyen thanh cong",
        200
      );
    } catch (error) {
      logger.error("Get wards by district controller error:", error);
      return errorResponse(
        res,
        "GET_WARDS_BY_DISTRICT_FAILED",
        "Lay danh sach phuong/xa theo quan/huyen that bai",
        500
      );
    }
  }

  /**
   * @route GET /api/wards/:id
   * @desc Lay thong tin chi tiet phuong/xa
   * @access Private (Admin, Staff, Viewer)
   */
  async getWardById(req, res) {
    try {
      const { id } = req.params;
      const ward = await wardService.getWardById(id);

      return successResponse(
        res,
        ward,
        "Lay thong tin phuong/xa thanh cong",
        200
      );
    } catch (error) {
      logger.error("Get ward by id controller error:", error);

      if (error.message.includes("Khong tim thay")) {
        return notFoundResponse(res, error.message);
      }

      return errorResponse(
        res,
        "GET_WARD_FAILED",
        "Lay thong tin phuong/xa that bai",
        500
      );
    }
  }
}

module.exports = new WardController();
