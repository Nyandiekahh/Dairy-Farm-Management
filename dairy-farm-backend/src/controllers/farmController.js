const firebaseService = require('../services/firebaseService');
const { HTTP_STATUS, ERROR_MESSAGES, COLLECTIONS, FARM_LOCATIONS } = require('../utils/constants');
const { sanitizeInput } = require('../utils/helpers');

class FarmController {
  async getAllFarms(req, res, next) {
    try {
      const farms = await firebaseService.getAll(COLLECTIONS.FARMS);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { farms }
      });
    } catch (error) {
      next(error);
    }
  }

  async getFarmById(req, res, next) {
    try {
      const { id } = req.params;
      
      const farm = await firebaseService.getById(COLLECTIONS.FARMS, id);
      
      if (!farm) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.FARM_NOT_FOUND
        });
      }

      // Get farm statistics
      const [cows, chickenBatches, users] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.COWS, { farmLocation: farm.location, isActive: true }),
        firebaseService.getAll(COLLECTIONS.CHICKEN_BATCHES, { farmLocation: farm.location, isActive: true }),
        firebaseService.getAll(COLLECTIONS.USERS, { assignedFarm: farm.location })
      ]);

      const farmWithStats = {
        ...farm,
        statistics: {
          totalCows: cows.length,
          totalChickenBatches: chickenBatches.length,
          totalChickens: chickenBatches.reduce((sum, batch) => sum + batch.currentCount, 0),
          totalUsers: users.length,
          farmers: users.filter(user => user.role === 'farmer').length,
          admins: users.filter(user => user.role === 'admin').length
        }
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { farm: farmWithStats }
      });
    } catch (error) {
      next(error);
    }
  }

  async createFarm(req, res, next) {
    try {
      const {
        name,
        location,
        address,
        contactPhone,
        contactEmail,
        manager,
        description,
        coordinates,
        establishedDate,
        size,
        specialization
      } = req.body;
      
      // Check if farm with this location already exists
      const existingFarms = await firebaseService.getAll(COLLECTIONS.FARMS, { location });
      if (existingFarms.length > 0) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: 'Farm with this location already exists'
        });
      }

      const farmData = {
        name: sanitizeInput(name),
        location: sanitizeInput(location),
        address: address ? sanitizeInput(address) : null,
        contactPhone: contactPhone ? sanitizeInput(contactPhone) : null,
        contactEmail: contactEmail ? sanitizeInput(contactEmail) : null,
        manager: manager ? sanitizeInput(manager) : null,
        description: description ? sanitizeInput(description) : null,
        coordinates: coordinates || null,
        establishedDate: establishedDate ? new Date(establishedDate) : null,
        size: size ? parseFloat(size) : null,
        specialization: specialization || [],
        isActive: true,
        settings: {
          milkingSessions: ['morning', 'afternoon', 'evening'],
          milkingTimes: {
            morning: '06:00',
            afternoon: '13:00',
            evening: '18:00'
          },
          defaultCurrency: 'KES',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }
      };

      const newFarm = await firebaseService.create(COLLECTIONS.FARMS, farmData);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { farm: newFarm },
        message: 'Farm created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFarm(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.location; // Location should not be changed once set
      
      // Sanitize string fields
      const stringFields = ['name', 'address', 'contactPhone', 'contactEmail', 'manager', 'description'];
      stringFields.forEach(field => {
        if (updateData[field]) {
          updateData[field] = sanitizeInput(updateData[field]);
        }
      });

      // Convert date fields
      if (updateData.establishedDate) {
        updateData.establishedDate = new Date(updateData.establishedDate);
      }

      // Convert numeric fields
      if (updateData.size !== undefined) {
        updateData.size = parseFloat(updateData.size);
      }

      const updatedFarm = await firebaseService.update(COLLECTIONS.FARMS, id, updateData);
      
      if (!updatedFarm) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.FARM_NOT_FOUND
        });
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { farm: updatedFarm },
        message: 'Farm updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFarm(req, res, next) {
    try {
      const { id } = req.params;
      
      const farm = await firebaseService.getById(COLLECTIONS.FARMS, id);
      if (!farm) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.FARM_NOT_FOUND
        });
      }

      // Check if farm has associated data
      const [cows, chickenBatches, users] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.COWS, { farmLocation: farm.location }),
        firebaseService.getAll(COLLECTIONS.CHICKEN_BATCHES, { farmLocation: farm.location }),
        firebaseService.getAll(COLLECTIONS.USERS, { assignedFarm: farm.location })
      ]);

      if (cows.length > 0 || chickenBatches.length > 0 || users.length > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Cannot delete farm with associated data. Please reassign or remove all cows, chickens, and users first.'
        });
      }

      // Mark as inactive instead of deleting
      await firebaseService.update(COLLECTIONS.FARMS, id, { 
        isActive: false,
        deletedAt: new Date()
      });
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Farm deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getFarmSettings(req, res, next) {
    try {
      const { farmLocation } = req.params;
      
      const farms = await firebaseService.getAll(COLLECTIONS.FARMS, { location: farmLocation });
      
      if (farms.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.FARM_NOT_FOUND
        });
      }

      const farm = farms[0];
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { 
          settings: farm.settings || {},
          farmInfo: {
            name: farm.name,
            location: farm.location,
            manager: farm.manager
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFarmSettings(req, res, next) {
    try {
      const { farmLocation } = req.params;
      const { settings } = req.body;
      
      const farms = await firebaseService.getAll(COLLECTIONS.FARMS, { location: farmLocation });
      
      if (farms.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.FARM_NOT_FOUND
        });
      }

      const farm = farms[0];
      const updatedSettings = {
        ...farm.settings,
        ...settings,
        lastUpdated: new Date(),
        updatedBy: req.user.uid
      };

      const updatedFarm = await firebaseService.update(COLLECTIONS.FARMS, farm.id, { 
        settings: updatedSettings 
      });
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { settings: updatedSettings },
        message: 'Farm settings updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getFarmSummary(req, res, next) {
    try {
      const { farmLocation } = req.params;
      const { period = 'monthly' } = req.query;
      
      // Get farm details
      const farms = await firebaseService.getAll(COLLECTIONS.FARMS, { location: farmLocation });
      
      if (farms.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.FARM_NOT_FOUND
        });
      }

      const farm = farms[0];

      // Get date range for the period
      const dateRange = this.getDateRange(period);

      // Get all farm data in parallel
      const [
        cows,
        chickenBatches,
        milkRecords,
        eggRecords,
        feedRecords,
        healthRecords,
        users
      ] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.COWS, { farmLocation, isActive: true }),
        firebaseService.getAll(COLLECTIONS.CHICKEN_BATCHES, { farmLocation, isActive: true }),
        firebaseService.queryWithDateRange(COLLECTIONS.MILK_RECORDS, 'date', dateRange.start, dateRange.end, { farmLocation }),
        firebaseService.queryWithDateRange(COLLECTIONS.EGG_RECORDS, 'date', dateRange.start, dateRange.end, { farmLocation }),
        firebaseService.queryWithDateRange(COLLECTIONS.FEED_RECORDS, 'date', dateRange.start, dateRange.end, { farmLocation }),
        firebaseService.queryWithDateRange(COLLECTIONS.HEALTH_RECORDS, 'dateOfIllness', dateRange.start, dateRange.end, { farmLocation }),
        firebaseService.getAll(COLLECTIONS.USERS, { assignedFarm: farmLocation })
      ]);

      const summary = {
        farmInfo: {
          name: farm.name,
          location: farm.location,
          manager: farm.manager,
          establishedDate: farm.establishedDate,
          size: farm.size,
          specialization: farm.specialization
        },
        livestock: {
          cows: {
            total: cows.length,
            active: cows.filter(c => c.isActive).length,
            breeds: this.getBreakdown(cows, 'breed'),
            averageAge: this.calculateAverageAge(cows)
          },
          chickens: {
            totalBatches: chickenBatches.length,
            totalBirds: chickenBatches.reduce((sum, b) => sum + b.currentCount, 0),
            breeds: this.getBreakdown(chickenBatches, 'breed'),
            averageBatchSize: chickenBatches.length > 0 ? 
              Math.round(chickenBatches.reduce((sum, b) => sum + b.currentCount, 0) / chickenBatches.length) : 0
          }
        },
        production: {
          milk: {
            total: milkRecords.reduce((sum, r) => sum + r.quantity, 0),
            average: milkRecords.length > 0 ? 
              Math.round((milkRecords.reduce((sum, r) => sum + r.quantity, 0) / milkRecords.length) * 100) / 100 : 0,
            sessions: this.getBreakdown(milkRecords, 'session')
          },
          eggs: {
            total: eggRecords.reduce((sum, r) => sum + r.quantity, 0),
            average: eggRecords.length > 0 ? 
              Math.round((eggRecords.reduce((sum, r) => sum + r.quantity, 0) / eggRecords.length) * 100) / 100 : 0,
            batches: this.getBreakdown(eggRecords, 'batchId')
          }
        },
        health: {
          totalRecords: healthRecords.length,
          resolved: healthRecords.filter(r => r.isResolved).length,
          unresolved: healthRecords.filter(r => !r.isResolved).length,
          totalCost: healthRecords.reduce((sum, r) => sum + (r.cost || 0), 0),
          commonDiseases: this.getBreakdown(healthRecords, 'disease')
        },
        feed: {
          totalRecords: feedRecords.length,
          totalQuantity: feedRecords.reduce((sum, r) => sum + r.quantity, 0),
          feedTypes: this.getBreakdown(feedRecords, 'feedType')
        },
        staff: {
          total: users.length,
          farmers: users.filter(u => u.role === 'farmer').length,
          admins: users.filter(u => u.role === 'admin').length,
          active: users.filter(u => u.isActive).length
        },
        period: {
          start: dateRange.start,
          end: dateRange.end,
          type: period
        }
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { farmSummary: summary }
      });
    } catch (error) {
      next(error);
    }
  }

  async initializeFarmData(req, res, next) {
    try {
      const { farmLocation } = req.params;
      
      // Check if farm exists
      const farms = await firebaseService.getAll(COLLECTIONS.FARMS, { location: farmLocation });
      
      if (farms.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.FARM_NOT_FOUND
        });
      }

      const farm = farms[0];

      // Initialize default settings if not exist
      const defaultSettings = {
        milkingSessions: ['morning', 'afternoon', 'evening'],
        milkingTimes: {
          morning: '06:00',
          afternoon: '13:00',
          evening: '18:00'
        },
        defaultCurrency: 'KES',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        feedTypes: {
          concentrates: ['dairy_meal', 'maize_jam'],
          minerals: ['maclic_supa', 'maclic_plus'],
          roughage: ['napier', 'hay', 'silage']
        },
        chickenSettings: {
          defaultLifespan: 365,
          eggProductionAge: 150,
          defaultBatchSize: 100
        },
        notifications: {
          lowMilkProduction: true,
          healthIssues: true,
          feedRestock: true,
          chickenAging: true
        },
        initialized: true,
        initializedAt: new Date(),
        initializedBy: req.user.uid
      };

      const updatedFarm = await firebaseService.update(COLLECTIONS.FARMS, farm.id, { 
        settings: { ...farm.settings, ...defaultSettings }
      });
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { farm: updatedFarm },
        message: 'Farm data initialized successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  getDateRange(period) {
    const now = new Date();
    let start, end = new Date();

    switch (period) {
      case 'daily':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        start = new Date(now);
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
    }

    return { start, end };
  }

  getBreakdown(items, field) {
    return items.reduce((breakdown, item) => {
      const key = item[field] || 'Unknown';
      breakdown[key] = (breakdown[key] || 0) + 1;
      return breakdown;
    }, {});
  }

  calculateAverageAge(cows) {
    if (cows.length === 0) return 0;
    
    const totalAge = cows.reduce((sum, cow) => {
      const age = Math.floor((new Date() - new Date(cow.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365));
      return sum + age;
    }, 0);
    
    return Math.round((totalAge / cows.length) * 10) / 10;
  }
}

module.exports = new FarmController();