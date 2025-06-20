const firebaseService = require('../services/firebaseService');
const { auth } = require('../config/firebase'); // ADD THIS LINE
const { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES, COLLECTIONS } = require('../utils/constants');
const { sanitizeInput, paginate } = require('../utils/helpers');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, farm, role } = req.query;
      
      const filters = {};
      if (farm) filters.assignedFarm = farm;
      if (role) filters.role = role;
      
      const result = await firebaseService.getWithPagination(
        COLLECTIONS.USERS,
        filters,
        parseInt(page),
        parseInt(limit)
      );
      
      // Remove sensitive data from all users
      const sanitizedUsers = result.documents.map(user => {
        const { uid, password, ...userWithoutSensitiveData } = user;
        return userWithoutSensitiveData;
      });
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          users: sanitizedUsers,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await firebaseService.getById(COLLECTIONS.USERS, id);
      
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Remove sensitive data
      const { uid, password, ...userWithoutSensitiveData } = user;
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: userWithoutSensitiveData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const { email, password, firstName, lastName, role, assignedFarm, phone, permissions } = req.body;
      
      // Sanitize inputs
      const sanitizedData = {
        email: sanitizeInput(email.toLowerCase()),
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        role: sanitizeInput(role),
        assignedFarm: assignedFarm ? sanitizeInput(assignedFarm) : null,
        phone: phone ? sanitizeInput(phone) : null,
        permissions: permissions || this.getDefaultPermissions(role),
        isActive: true
      };

      // Check if user already exists
      const existingUser = await firebaseService.getUserByEmail(sanitizedData.email);
      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: ERROR_MESSAGES.EMAIL_EXISTS
        });
      }

      const newUser = await firebaseService.createUser({
        ...sanitizedData,
        password
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

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, role, assignedFarm, phone, permissions, isActive } = req.body;
      
      const updateData = {};
      
      if (firstName) updateData.firstName = sanitizeInput(firstName);
      if (lastName) updateData.lastName = sanitizeInput(lastName);
      if (role) updateData.role = sanitizeInput(role);
      if (assignedFarm !== undefined) updateData.assignedFarm = assignedFarm ? sanitizeInput(assignedFarm) : null;
      if (phone !== undefined) updateData.phone = phone ? sanitizeInput(phone) : null;
      if (permissions) updateData.permissions = permissions;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedUser = await firebaseService.update(COLLECTIONS.USERS, id, updateData);
      
      if (!updatedUser) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Remove sensitive data
      const { uid, password, ...userWithoutSensitiveData } = updatedUser;
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: userWithoutSensitiveData
        },
        message: 'User updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      
      // Check if user exists
      const user = await firebaseService.getById(COLLECTIONS.USERS, id);
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Delete from Firestore
      await firebaseService.delete(COLLECTIONS.USERS, id);
      
      // Delete from Firebase Auth
      try {
        await auth.deleteUser(user.uid);
      } catch (authError) {
        console.error('Error deleting user from Firebase Auth:', authError);
        // Continue even if auth deletion fails
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsersByFarm(req, res, next) {
    try {
      const { farmLocation } = req.params;
      const { role } = req.query;
      
      const filters = { assignedFarm: farmLocation };
      if (role) filters.role = role;
      
      const users = await firebaseService.getAll(COLLECTIONS.USERS, filters);
      
      // Remove sensitive data from all users
      const sanitizedUsers = users.map(user => {
        const { uid, password, ...userWithoutSensitiveData } = user;
        return userWithoutSensitiveData;
      });
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          users: sanitizedUsers
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserPermissions(req, res, next) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      
      const updatedUser = await firebaseService.update(COLLECTIONS.USERS, id, { permissions });
      
      if (!updatedUser) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.USER_NOT_FOUND
        });
      }

      // Remove sensitive data
      const { uid, password, ...userWithoutSensitiveData } = updatedUser;
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: userWithoutSensitiveData
        },
        message: 'User permissions updated successfully'
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
      Object.keys(permissions).forEach(key => {
        permissions[key] = true;
      });
    } else if (role === USER_ROLES.FARMER) {
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

module.exports = new UserController();