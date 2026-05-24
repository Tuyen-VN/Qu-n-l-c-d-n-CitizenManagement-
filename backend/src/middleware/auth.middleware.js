const jwt = require('jsonwebtoken');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Middleware xac thuc JWT token
 */
const verifyToken = (req, res, next) => {

  try {

    // Lay token tu header

    const authHeader = req.headers.authorization;



    if (!authHeader || !authHeader.startsWith('Bearer ')) {

      return unauthorizedResponse(res, 'Token khong hop le');

    }



    const token = authHeader.substring(7); // Bo 'Bearer '



    // Xac thuc token

    const decoded = jwt.verify(token, process.env.JWT_SECRET);



    // Gan thong tin user vao request

    req.user = {

      userId: decoded.userId,

      username: decoded.username,

      roleId: decoded.roleId,

      roleName: decoded.roleName,

      wardId: decoded.wardId,

    };



    next();

  } catch (error) {

    logger.error('Token verification failed:', error);



    if (error.name === 'TokenExpiredError') {

      return unauthorizedResponse(res, 'Token da het han');

    }



    if (error.name === 'JsonWebTokenError') {

      return unauthorizedResponse(res, 'Token khong hop le');

    }



    return unauthorizedResponse(res, 'Xac thuc that bai');

  }

}; 



/**
 * Middleware phan quyen theo role
 * @param {array} allowedRoles - Danh sach role duoc phep (vi du: ['Admin', 'Staff'])
 */
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return unauthorizedResponse(res, 'Vui long dang nhap');
      }

      const { roleName } = req.user;

      if (!allowedRoles.includes(roleName)) {
        logger.warn(
          `User ${req.user.username} (role: ${roleName}) tried to access restricted resource`
        );
        return forbiddenResponse(
          res,
          'Ban khong co quyen truy cap tai nguyen nay'
        );
      }

      next();
    } catch (error) {
      logger.error('Role verification failed:', error);
      return forbiddenResponse(res, 'Loi phan quyen');
    }
  };
};

/**
 * Middleware kiem tra quyen truy cap theo Ward
 * Staff chi duoc truy cap du lieu cua Ward ma ho quan ly
 * Admin duoc truy cap tat ca
 */
const verifyWardAccess = (req, res, next) => {
  try {
    const { roleName, wardId } = req.user;

    // Admin co quyen truy cap tat ca
    if (roleName === 'Admin') {
      return next();
    }

    // Staff phai co wardId
    if (roleName === 'Staff' && !wardId) {
      return forbiddenResponse(
        res,
        'Tai khoan chua duoc gan phuong/xa quan ly'
      );
    }

    // Luu wardId vao request de su dung trong controller
    req.allowedWardId = wardId;

    next();
  } catch (error) {
    logger.error('Ward access verification failed:', error);
    return forbiddenResponse(res, 'Loi kiem tra quyen truy cap');
  }
};

/**
 * Middleware cho phep truy cap cong khai (khong can token)
 * Neu co token hop le thi gan user info, khong thi bo qua
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
      wardId: decoded.wardId,
    };

    next();
  } catch (error) {
    // Neu token khong hop le, van cho phep tiep tuc nhung khong co user info
    next();
  }
};

module.exports = {
  verifyToken,
  verifyRole,
  verifyWardAccess,
  optionalAuth,
};