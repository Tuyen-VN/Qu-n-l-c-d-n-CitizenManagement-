const auditService = require('../services/audit.service');
const logger = require('../utils/logger');

/**
 * Middleware tu dong ghi audit log cho cac hanh dong quan trong
 * Su dung sau khi thuc hien action thanh cong
 */
const logAudit = (action, tableName) => {
  return async (req, res, next) => {
    // Luu lai response.json de intercept
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      // Chi ghi log khi request thanh cong
      if (body.success && req.user) {
        try {
          const userId = req.user.userId;
          const ipAddress = req.ip || req.connection.remoteAddress;
          const userAgent = req.get('user-agent');


          let recordId = null;

          if (body.data && body.data.citizen_id) {

            recordId = body.data.citizen_id;

          } else if (body.data && body.data.household_id) {

            recordId = body.data.household_id;

          } else if (req.params.id) {

            recordId = parseInt(req.params.id);

          } 

          // Lay old value va new value
          const oldValue = req.oldValue || null; // Can set truoc do neu can
          const newValue = action === 'DELETE' ? null : req.body;

          await auditService.log(
            userId,
            action,
            tableName,
            recordId,
            oldValue,
            newValue,
            ipAddress,
            userAgent
          );
        } catch (error) {
          logger.error('Audit logging failed:', error);
          // Khong throw error de khong anh huong den response
        }
      }

      // Goi original json response
      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware lay old value truoc khi update hoac delete
 * Su dung TRUOC controller
 */
const captureOldValue = (service, getByIdMethod = 'getById') => {
  return async (req, res, next) => {
    try {
      const id = req.params.id;

      if (id && service && service[getByIdMethod]) {
        const oldData = await service[getByIdMethod](id);
        req.oldValue = oldData;
      }
    } catch (error) {
      // Khong throw error, chi log warning
      logger.warn('Failed to capture old value for audit:', error);
    }

    next();
  };
};

/**
 * Middleware ghi log LOGIN
 */
const logLogin = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    if (body.success && body.data && body.data.user) {
      try {
        const userId = body.data.user.userId;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        await auditService.log(
          userId,
          'LOGIN',
          'Users',
          userId,
          null,
          { username: body.data.user.username },
          ipAddress,
          userAgent
        );
      } catch (error) {
        logger.error('Login audit failed:', error);
      }
    }

    return originalJson(body);
  };

  next();
};

/**
 * Middleware ghi log LOGOUT
 */
const logLogout = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    if (body.success && req.user) {
      try {
        const userId = req.user.userId;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');

        await auditService.log(
          userId,
          'LOGOUT',
          'Users',
          userId,
          null,
          null,
          ipAddress,
          userAgent
        );
      } catch (error) {
        logger.error('Logout audit failed:', error);
      }
    }

    return originalJson(body);
  };

  next();
};

module.exports = {
  logAudit,
  captureOldValue,
  logLogin,
  logLogout,
};