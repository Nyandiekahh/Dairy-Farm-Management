const { auth } = require('../config/firebase');
const firebaseService = require('../services/firebaseService');
const { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES, COLLECTIONS } = require('../utils/constants');
const { sanitizeInput } = require('../utils/helpers');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // This endpoint is mainly for validation - actual auth happens on frontend
      // We just verify user exists and return user data
      const user = await firebaseService.getUserByEmail(email);
      
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Remove sensitive data
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: userWithoutPassword
        },
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, role, assignedFarm, phone } = req.body;
      
      // Sanitize inputs
      const sanitizedData = {
        email: sanitizeInput(email.toLowerCase()),
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        role: sanitizeInput(role),
        assignedFarm: assignedFarm ? sanitizeInput(assignedFarm) : null,
        phone: phone ? sanitizeInput(phone) : null
      };

      // Check if user already exists
      const existingUser = await firebaseService.getUserByEmail(sanitizedData.email);
      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: ERROR_MESSAGES.EMAIL_EXISTS
        });
      }

      // Create user
      const newUser = await firebaseService.createUser({
        ...sanitizedData,
        password,
        isActive: true,
        permissions: this.getDefaultPermissions(role)
      });

      // Remove sensitive data
      const { password: _, uid, ...userWithoutSensitiveData } = newUser;
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          user: userWithoutSensitiveData
        },
        message: 'User created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(req, res, next) {
    try {
      const user = await firebaseService.getById(COLLECTIONS.USERS, req.user.uid);
      
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Remove sensitive data
      const { uid, ...userWithoutSensitiveData } = user;
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: userWithoutSensitiveData,
          isAuthenticated: true
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // For Firebase, logout is handled on frontend
      // This endpoint can be used for logging or cleanup
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.uid;

      // Update password in Firebase Auth
      await auth.updateUser(userId, {
        password: newPassword
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.uid;
      const { firstName, lastName, phone } = req.body;

      const updateData = {
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        phone: phone ? sanitizeInput(phone) : null
      };

      const updatedUser = await firebaseService.update(COLLECTIONS.USERS, userId, updateData);
      
      // Remove sensitive data
      const { uid, password, ...userWithoutSensitiveData } = updatedUser;
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: userWithoutSensitiveData
        },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  getDefaultPermissions(role) {
    const permissions = {
      canViewCows: false,
      canAddCows: false,
      canEditCows: false,
      canDeleteCows: false,
      canViewMilkRecords: false,
      canAddMilkRecords: false,
      canEditMilkRecords: false,
      canViewFeedRecords: false,
      canAddFeedRecords: false,
      canEditFeedRecords: false,
      canViewHealthRecords: false,
      canAddHealthRecords: false,
      canEditHealthRecords: false,
      canViewChicken: false,
      canAddChicken: false,
      canEditChicken: false,
      canDeleteChicken: false,
      canViewStats: false,
      canManageUsers: false,
      canManageSystem: false,
      canViewSalesData: false,
      canEditSalesData: false
    };

    if (role === USER_ROLES.ADMIN) {
      // Admins have all permissions
      Object.keys(permissions).forEach(key => {
        permissions[key] = true;
      });
    } else if (role === USER_ROLES.FARMER) {
      // Farmers have limited permissions
      permissions.canViewCows = true;
      permissions.canViewMilkRecords = true;
      permissions.canAddMilkRecords = true;
      permissions.canViewFeedRecords = true;
      permissions.canAddFeedRecords = true;
      permissions.canViewChicken = true;
      permissions.canViewStats = true;
    }

    return permissions;
  }
}

module.exports = new AuthController();