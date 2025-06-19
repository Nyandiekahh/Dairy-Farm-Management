const firebaseService = require('../services/firebaseService');
const { HTTP_STATUS, ERROR_MESSAGES, COLLECTIONS, FEED_TYPES } = require('../utils/constants');
const { sanitizeInput, formatDate, generateId } = require('../utils/helpers');
const { getDateRanges } = require('../utils/dateUtils');

class FeedController {
  async getAllFeedRecords(req, res, next) {
    try {
      const { page = 1, limit = 10, cowId, farmLocation, feedType, date } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const filters = {};
      
      // Apply farm filter based on user role
      if (userRole === 'farmer') {
        filters.farmLocation = userFarm;
      } else if (farmLocation) {
        filters.farmLocation = farmLocation;
      }
      
      if (cowId) filters.cowId = cowId;
      if (feedType) filters.feedType = feedType;
      
      let feedRecords;
      
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        feedRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.FEED_RECORDS,
          'date',
          startDate,
          endDate,
          filters
        );
        
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: { feedRecords }
        });
      } else {
        const result = await firebaseService.getWithPagination(
          COLLECTIONS.FEED_RECORDS,
          filters,
          parseInt(page),
          parseInt(limit),
          'date',
          'desc'
        );
        
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: {
            feedRecords: result.documents,
            pagination: result.pagination
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async getFeedRecordById(req, res, next) {
    try {
      const { id } = req.params;
      
      const feedRecord = await firebaseService.getById(COLLECTIONS.FEED_RECORDS, id);
      
      if (!feedRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Feed record not found'
        });
      }

      // Get cow details
      const cow = await firebaseService.getById(COLLECTIONS.COWS, feedRecord.cowId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          feedRecord: {
            ...feedRecord,
            cow: cow ? { id: cow.id, name: cow.name, earTagNumber: cow.earTagNumber } : null
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createFeedRecord(req, res, next) {
    try {
      const { cowId, feedType, subType, quantity, unit, date, notes, recordedBy } = req.body;
      
      // Verify cow exists
      const cow = await firebaseService.getById(COLLECTIONS.COWS, cowId);
      if (!cow) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.COW_NOT_FOUND
        });
      }

      const feedData = {
        cowId: sanitizeInput(cowId),
        cowName: cow.name,
        earTagNumber: cow.earTagNumber,
        farmLocation: cow.farmLocation,
        feedType: sanitizeInput(feedType),
        subType: subType ? sanitizeInput(subType) : null,
        quantity: parseFloat(quantity),
        unit: sanitizeInput(unit || 'kg'),
        date: new Date(date),
        notes: notes ? sanitizeInput(notes) : null,
        recordedBy: recordedBy || req.user.uid,
        recordedAt: new Date()
      };

      const newRecord = await firebaseService.create(COLLECTIONS.FEED_RECORDS, feedData);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { feedRecord: newRecord },
        message: 'Feed record created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async createBulkFeedRecord(req, res, next) {
    try {
      const { cowIds, feedType, subType, quantity, unit, date, notes } = req.body;
      
      if (!Array.isArray(cowIds) || cowIds.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Cow IDs array is required'
        });
      }

      // Verify all cows exist
      const cows = await Promise.all(
        cowIds.map(id => firebaseService.getById(COLLECTIONS.COWS, id))
      );
      
      const invalidCows = cows.filter(cow => !cow);
      if (invalidCows.length > 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Some cows were not found'
        });
      }

      // Create feed records for all cows
      const feedRecords = await Promise.all(
        cows.map(cow => {
          const feedData = {
            cowId: cow.id,
            cowName: cow.name,
            earTagNumber: cow.earTagNumber,
            farmLocation: cow.farmLocation,
            feedType: sanitizeInput(feedType),
            subType: subType ? sanitizeInput(subType) : null,
            quantity: parseFloat(quantity),
            unit: sanitizeInput(unit || 'kg'),
            date: new Date(date),
            notes: notes ? sanitizeInput(notes) : null,
            recordedBy: req.user.uid,
            recordedAt: new Date(),
            batchId: generateId() // To identify bulk entries
          };
          
          return firebaseService.create(COLLECTIONS.FEED_RECORDS, feedData);
        })
      );
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { feedRecords },
        message: `${feedRecords.length} feed records created successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFeedRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { feedType, subType, quantity, unit, date, notes } = req.body;
      
      const updateData = {};
      if (feedType) updateData.feedType = sanitizeInput(feedType);
      if (subType !== undefined) updateData.subType = subType ? sanitizeInput(subType) : null;
      if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
      if (unit) updateData.unit = sanitizeInput(unit);
      if (date) updateData.date = new Date(date);
      if (notes !== undefined) updateData.notes = notes ? sanitizeInput(notes) : null;
      updateData.lastModifiedBy = req.user.uid;
      updateData.lastModifiedAt = new Date();

      const updatedRecord = await firebaseService.update(COLLECTIONS.FEED_RECORDS, id, updateData);
      
      if (!updatedRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Feed record not found'
        });
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { feedRecord: updatedRecord },
        message: 'Feed record updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFeedRecord(req, res, next) {
    try {
      const { id } = req.params;
      
      const feedRecord = await firebaseService.getById(COLLECTIONS.FEED_RECORDS, id);
      if (!feedRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Feed record not found'
        });
      }

      await firebaseService.delete(COLLECTIONS.FEED_RECORDS, id);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Feed record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeedRecordsByCow(req, res, next) {
    try {
      const { cowId } = req.params;
      const { startDate, endDate, feedType } = req.query;
      
      const filters = { cowId };
      if (feedType) filters.feedType = feedType;
      
      let feedRecords;
      
      if (startDate && endDate) {
        feedRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.FEED_RECORDS,
          'date',
          new Date(startDate),
          new Date(endDate),
          filters
        );
      } else {
        feedRecords = await firebaseService.getAll(COLLECTIONS.FEED_RECORDS, filters);
      }
      
      // Sort by date descending
      feedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { feedRecords }
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeedInventory(req, res, next) {
    try {
      const { farmLocation } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      // Only admins can view inventory
      if (userRole !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN
        });
      }
      
      const filters = {};
      if (farmLocation) filters.farmLocation = farmLocation;
      
      const inventory = await firebaseService.getAll(COLLECTIONS.FEED_INVENTORY, filters);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { inventory }
      });
    } catch (error) {
      next(error);
    }
  }

  async createFeedInventory(req, res, next) {
    try {
      const { 
        farmLocation, 
        feedType, 
        subType, 
        quantity, 
        unit, 
        purchaseDate, 
        purchasePrice, 
        supplier, 
        transportCost,
        expiryDate,
        notes 
      } = req.body;
      
      const inventoryData = {
        farmLocation: sanitizeInput(farmLocation),
        feedType: sanitizeInput(feedType),
        subType: subType ? sanitizeInput(subType) : null,
        quantity: parseFloat(quantity),
        unit: sanitizeInput(unit || 'kg'),
        purchaseDate: new Date(purchaseDate),
        purchasePrice: parseFloat(purchasePrice),
        supplier: supplier ? sanitizeInput(supplier) : null,
        transportCost: transportCost ? parseFloat(transportCost) : 0,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes ? sanitizeInput(notes) : null,
        currentStock: parseFloat(quantity),
        isActive: true,
        needsRestock: false,
        recordedBy: req.user.uid
      };

      const newInventory = await firebaseService.create(COLLECTIONS.FEED_INVENTORY, inventoryData);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { inventory: newInventory },
        message: 'Feed inventory created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFeedInventory(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        quantity, 
        purchasePrice, 
        supplier, 
        transportCost, 
        expiryDate, 
        notes,
        needsRestock,
        isActive 
      } = req.body;
      
      const updateData = {};
      if (quantity !== undefined) {
        updateData.quantity = parseFloat(quantity);
        updateData.currentStock = parseFloat(quantity);
      }
      if (purchasePrice !== undefined) updateData.purchasePrice = parseFloat(purchasePrice);
      if (supplier !== undefined) updateData.supplier = supplier ? sanitizeInput(supplier) : null;
      if (transportCost !== undefined) updateData.transportCost = parseFloat(transportCost);
      if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
      if (notes !== undefined) updateData.notes = notes ? sanitizeInput(notes) : null;
      if (needsRestock !== undefined) updateData.needsRestock = needsRestock;
      if (isActive !== undefined) updateData.isActive = isActive;
      updateData.lastModifiedBy = req.user.uid;

      const updatedInventory = await firebaseService.update(COLLECTIONS.FEED_INVENTORY, id, updateData);
      
      if (!updatedInventory) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Feed inventory not found'
        });
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { inventory: updatedInventory },
        message: 'Feed inventory updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async markForRestock(req, res, next) {
    try {
      const { id } = req.params;
      
      const updatedInventory = await firebaseService.update(COLLECTIONS.FEED_INVENTORY, id, {
        needsRestock: true,
        restockRequestedBy: req.user.uid,
        restockRequestedAt: new Date()
      });
      
      if (!updatedInventory) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Feed inventory not found'
        });
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { inventory: updatedInventory },
        message: 'Feed marked for restock successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeedStats(req, res, next) {
    try {
      const { farmLocation, period = 'daily', startDate, endDate, feedType } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const filters = {};
      
      // Apply farm filter based on user role
      if (userRole === 'farmer') {
        filters.farmLocation = userFarm;
     } else if (farmLocation) {
       filters.farmLocation = farmLocation;
     }
     
     if (feedType) filters.feedType = feedType;
     
     let feedRecords;
     
     if (startDate && endDate) {
       feedRecords = await firebaseService.queryWithDateRange(
         COLLECTIONS.FEED_RECORDS,
         'date',
         new Date(startDate),
         new Date(endDate),
         filters
       );
     } else {
       const dateRange = getDateRanges(period);
       feedRecords = await firebaseService.queryWithDateRange(
         COLLECTIONS.FEED_RECORDS,
         'date',
         dateRange.start,
         dateRange.end,
         filters
       );
     }
     
     const stats = this.calculateFeedStats(feedRecords, period);
     
     res.status(HTTP_STATUS.OK).json({
       success: true,
       data: { stats }
     });
   } catch (error) {
     next(error);
   }
 }

 // Helper methods
 calculateFeedStats(records, period) {
   const stats = {
     totalQuantity: 0,
     totalRecords: records.length,
     feedTypeBreakdown: {},
     cowBreakdown: {},
     dailyBreakdown: {},
     averagePerCow: 0,
     periodSummary: {}
   };

   const cowSet = new Set();

   records.forEach(record => {
     stats.totalQuantity += record.quantity;
     cowSet.add(record.cowId);
     
     // Feed type breakdown
     const feedKey = record.subType ? `${record.feedType}_${record.subType}` : record.feedType;
     if (!stats.feedTypeBreakdown[feedKey]) {
       stats.feedTypeBreakdown[feedKey] = { quantity: 0, records: 0 };
     }
     stats.feedTypeBreakdown[feedKey].quantity += record.quantity;
     stats.feedTypeBreakdown[feedKey].records += 1;
     
     // Cow breakdown
     if (!stats.cowBreakdown[record.cowId]) {
       stats.cowBreakdown[record.cowId] = {
         cowName: record.cowName,
         quantity: 0,
         records: 0
       };
     }
     stats.cowBreakdown[record.cowId].quantity += record.quantity;
     stats.cowBreakdown[record.cowId].records += 1;
     
     // Daily breakdown
     const dateKey = formatDate(record.date);
     if (!stats.dailyBreakdown[dateKey]) {
       stats.dailyBreakdown[dateKey] = 0;
     }
     stats.dailyBreakdown[dateKey] += record.quantity;
   });

   stats.averagePerCow = cowSet.size > 0 ? 
     Math.round((stats.totalQuantity / cowSet.size) * 100) / 100 : 0;

   const dailyValues = Object.values(stats.dailyBreakdown);
   if (dailyValues.length > 0) {
     stats.periodSummary = {
       averageDaily: Math.round((dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length) * 100) / 100,
       maxDaily: Math.max(...dailyValues),
       minDaily: Math.min(...dailyValues),
       totalDays: dailyValues.length,
       totalCows: cowSet.size
     };
   }

   return stats;
 }
}

module.exports = new FeedController();