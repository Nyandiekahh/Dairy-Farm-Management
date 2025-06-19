const { db } = require('../config/firebase');
const { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES, COLLECTIONS } = require('../utils/constants');

const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.uid;
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      
      if (!userDoc.exists) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      const userData = userDoc.data();
      const userRole = userData.role;

      if (!roles.includes(userRole)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN
        });
      }

      req.userRole = userRole;
      req.userFarm = userData.assignedFarm;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
};

const requireAdmin = requireRole([USER_ROLES.ADMIN]);
const requireFarmer = requireRole([USER_ROLES.FARMER]);
const requireAnyRole = requireRole([USER_ROLES.ADMIN, USER_ROLES.FARMER]);

module.exports = {
  requireRole,
  requireAdmin,
  requireFarmer,
  requireAnyRole
};