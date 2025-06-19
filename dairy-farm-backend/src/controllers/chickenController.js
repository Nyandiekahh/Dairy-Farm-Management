const firebaseService = require('../services/firebaseService');
const { HTTP_STATUS, ERROR_MESSAGES, COLLECTIONS } = require('../utils/constants');
const { sanitizeInput, generateBatchId, formatDate } = require('../utils/helpers');
const { getDateRanges } = require('../utils/dateUtils');

class ChickenController {
  async getAllBatches(req, res, next) {
    try {
      const { page = 1, limit = 10, farmLocation, isActive } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const filters = {};
      
      // Apply farm filter based on user role
      if (userRole === 'farmer') {
        filters.farmLocation = userFarm;
      } else if (farmLocation) {
        filters.farmLocation = farmLocation;
      }
      
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const result = await firebaseService.getWithPagination(
        COLLECTIONS.CHICKEN_BATCHES,
        filters,
        parseInt(page),
        parseInt(limit),
        'dateAcquired',
        'desc'
      );
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          batches: result.documents,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getBatchById(req, res, next) {
    try {
      const { id } = req.params;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const batch = await firebaseService.getById(COLLECTIONS.CHICKEN_BATCHES, id);
      
      if (!batch) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Chicken batch not found'
        });
      }

      // Check farm access for farmers
      if (userRole === 'farmer' && batch.farmLocation !== userFarm) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN
        });
      }

      // Get additional data
      const [eggRecords, feedRecords] = await Promise.all([
        this.getBatchEggRecords(id),
        this.getBatchFeedRecords(id)
      ]);

      const batchWithDetails = {
        ...batch,
        totalEggRecords: eggRecords.length,
        totalFeedRecords: feedRecords.length,
        totalEggsProduced: eggRecords.reduce((sum, record) => sum + record.quantity, 0),
        averageEggsPerDay: this.calculateAverageEggsPerDay(eggRecords, batch.dateAcquired),
        daysActive: Math.floor((new Date() - new Date(batch.dateAcquired)) / (1000 * 60 * 60 * 24))
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { batch: batchWithDetails }
      });
    } catch (error) {
      next(error);
    }
  }

  async createBatch(req, res, next) {
    try {
      const {
        batchId,
        initialCount,
        dateAcquired,
        farmLocation,
        breed,
        cost,
        supplier,
        description,
        expectedEggProductionAge,
        expectedLifespan
      } = req.body;
      
      // Check if batch ID already exists
      const existingBatch = await firebaseService.getAll(COLLECTIONS.CHICKEN_BATCHES, { batchId });
      if (existingBatch.length > 0) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: 'Batch ID already exists'
        });
      }

      const batchData = {
        batchId: sanitizeInput(batchId) || generateBatchId('CHICK'),
        initialCount: parseInt(initialCount),
        currentCount: parseInt(initialCount),
        dateAcquired: new Date(dateAcquired),
        farmLocation: sanitizeInput(farmLocation),
        breed: breed ? sanitizeInput(breed) : null,
        cost: cost ? parseFloat(cost) : null,
        supplier: supplier ? sanitizeInput(supplier) : null,
        description: description ? sanitizeInput(description) : null,
        expectedEggProductionAge: expectedEggProductionAge ? parseInt(expectedEggProductionAge) : 150, // days
        expectedLifespan: expectedLifespan ? parseInt(expectedLifespan) : 365, // days
        isActive: true,
        totalEggsProduced: 0,
        totalDeaths: 0,
        totalHatched: 0,
        feedConsumption: {
          totalQuantity: 0,
          averagePerDay: 0
        },
        productionStats: {
          startedLayingDate: null,
          peakProductionDate: null,
          averageEggsPerDay: 0
        }
      };

      const newBatch = await firebaseService.create(COLLECTIONS.CHICKEN_BATCHES, batchData);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { batch: newBatch },
        message: 'Chicken batch created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBatch(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.totalEggsProduced;
      delete updateData.totalDeaths;
      delete updateData.totalHatched;
      
      // Sanitize string fields
      const stringFields = ['batchId', 'farmLocation', 'breed', 'supplier', 'description'];
      stringFields.forEach(field => {
        if (updateData[field]) {
          updateData[field] = sanitizeInput(updateData[field]);
        }
      });

      // Convert numeric fields
      const numericFields = ['initialCount', 'currentCount', 'cost', 'expectedEggProductionAge', 'expectedLifespan'];
      numericFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateData[field] = parseFloat(updateData[field]);
        }
      });

      // Convert date fields
      if (updateData.dateAcquired) {
        updateData.dateAcquired = new Date(updateData.dateAcquired);
      }

      const updatedBatch = await firebaseService.update(COLLECTIONS.CHICKEN_BATCHES, id, updateData);
      
      if (!updatedBatch) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Chicken batch not found'
        });
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { batch: updatedBatch },
        message: 'Chicken batch updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBatch(req, res, next) {
    try {
      const { id } = req.params;
      
      const batch = await firebaseService.getById(COLLECTIONS.CHICKEN_BATCHES, id);
      if (!batch) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Chicken batch not found'
        });
      }

      // Mark as inactive instead of deleting to preserve data integrity
      await firebaseService.update(COLLECTIONS.CHICKEN_BATCHES, id, { 
        isActive: false,
        deletedAt: new Date()
      });
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Chicken batch deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateChickenCount(req, res, next) {
    try {
      const { id } = req.params;
      const { operation, count, reason, date, notes } = req.body;
      
      const batch = await firebaseService.getById(COLLECTIONS.CHICKEN_BATCHES, id);
      if (!batch) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Chicken batch not found'
        });
      }

      let newCount = batch.currentCount;
      let updateData = {};

      switch (operation) {
        case 'decrease': // Deaths
          newCount = Math.max(0, batch.currentCount - parseInt(count));
          updateData.totalDeaths = (batch.totalDeaths || 0) + parseInt(count);
          break;
        case 'increase': // Hatched
          newCount = batch.currentCount + parseInt(count);
          updateData.totalHatched = (batch.totalHatched || 0) + parseInt(count);
          break;
        default:
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'Invalid operation. Must be "decrease" or "increase"'
          });
      }

      updateData.currentCount = newCount;

      // Create a record of this change
      const changeRecord = {
        batchId: id,
        operation,
        count: parseInt(count),
        reason: reason ? sanitizeInput(reason) : null,
        date: date ? new Date(date) : new Date(),
        notes: notes ? sanitizeInput(notes) : null,
        previousCount: batch.currentCount,
        newCount,
        recordedBy: req.user.uid
      };

      await firebaseService.create('chicken_count_changes', changeRecord);

      const updatedBatch = await firebaseService.update(COLLECTIONS.CHICKEN_BATCHES, id, updateData);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { 
          batch: updatedBatch,
          change: changeRecord
        },
        message: `Chicken count ${operation}d successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllEggRecords(req, res, next) {
    try {
      const { page = 1, limit = 10, batchId, farmLocation, date } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const filters = {};
      
      // Apply farm filter based on user role
      if (userRole === 'farmer') {
        filters.farmLocation = userFarm;
      } else if (farmLocation) {
        filters.farmLocation = farmLocation;
      }
      
      if (batchId) filters.batchId = batchId;
      
      let eggRecords;
      
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        eggRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.EGG_RECORDS,
          'date',
          startDate,
          endDate,
          filters
        );
        
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: { eggRecords }
        });
      } else {
        const result = await firebaseService.getWithPagination(
          COLLECTIONS.EGG_RECORDS,
          filters,
          parseInt(page),
          parseInt(limit),
          'date',
          'desc'
        );
        
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: {
            eggRecords: result.documents,
            pagination: result.pagination
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async createEggRecord(req, res, next) {
    try {
      const { batchId, quantity, date, notes, recordedBy } = req.body;
      
      // Verify batch exists
      const batch = await firebaseService.getById(COLLECTIONS.CHICKEN_BATCHES, batchId);
      if (!batch) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Chicken batch not found'
        });
      }

      // Check if record already exists for this batch and date
      const existingRecord = await this.checkExistingEggRecord(batchId, date);
      if (existingRecord) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: 'Egg record already exists for this batch and date'
        });
      }

      const eggData = {
        batchId: sanitizeInput(batchId),
        batchName: batch.batchId,
        farmLocation: batch.farmLocation,
        quantity: parseInt(quantity),
        date: new Date(date),
        notes: notes ? sanitizeInput(notes) : null,
        recordedBy: recordedBy || req.user.uid,
        recordedAt: new Date()
      };

      const newRecord = await firebaseService.create(COLLECTIONS.EGG_RECORDS, eggData);
      
      // Update batch statistics
      await this.updateBatchEggStats(batchId);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { eggRecord: newRecord },
        message: 'Egg record created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEggRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity, date, notes } = req.body;
      
      const updateData = {};
      if (quantity !== undefined) updateData.quantity = parseInt(quantity);
      if (date) updateData.date = new Date(date);
      if (notes !== undefined) updateData.notes = notes ? sanitizeInput(notes) : null;
      updateData.lastModifiedBy = req.user.uid;
      updateData.lastModifiedAt = new Date();

      const updatedRecord = await firebaseService.update(COLLECTIONS.EGG_RECORDS, id, updateData);
      
      if (!updatedRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Egg record not found'
        });
      }

      // Update batch statistics
      await this.updateBatchEggStats(updatedRecord.batchId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { eggRecord: updatedRecord },
        message: 'Egg record updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEggRecord(req, res, next) {
    try {
      const { id } = req.params;
      
      const eggRecord = await firebaseService.getById(COLLECTIONS.EGG_RECORDS, id);
      if (!eggRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Egg record not found'
        });
      }

      await firebaseService.delete(COLLECTIONS.EGG_RECORDS, id);
      
      // Update batch statistics
      await this.updateBatchEggStats(eggRecord.batchId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Egg record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getEggStats(req, res, next) {
    try {
      const { farmLocation, period = 'daily', startDate, endDate, batchId } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const filters = {};
      
      // Apply farm filter based on user role
      if (userRole === 'farmer') {
        filters.farmLocation = userFarm;
      } else if (farmLocation) {
        filters.farmLocation = farmLocation;
      }
      
      if (batchId) filters.batchId = batchId;
      
      let eggRecords;
      
      if (startDate && endDate) {
        eggRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.EGG_RECORDS,
          'date',
          new Date(startDate),
          new Date(endDate),
          filters
        );
      } else {
        const dateRange = getDateRanges(period);
        eggRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.EGG_RECORDS,
          'date',
          dateRange.start,
          dateRange.end,
          filters
        );
      }
      
      const stats = this.calculateEggStats(eggRecords, period);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }

  async getChickenFeedRecords(req, res, next) {
    try {
      const { batchId, startDate, endDate } = req.query;
      
      if (!batchId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Batch ID is required'
        });
      }

      const filters = { 
        batchId,
        feedType: 'chicken_feed'
      };
      
      let feedRecords;
      
      if (startDate && endDate) {
        feedRecords = await firebaseService.queryWithDateRange(
          'chicken_feed_records',
          'date',
          new Date(startDate),
          new Date(endDate),
          filters
        );
      } else {
        feedRecords = await firebaseService.getAll('chicken_feed_records', filters);
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { feedRecords }
      });
    } catch (error) {
      next(error);
    }
  }

  async createChickenFeedRecord(req, res, next) {
    try {
      const { batchId, quantity, feedType, cost, date, supplier, notes } = req.body;
      
      // Verify batch exists
      const batch = await firebaseService.getById(COLLECTIONS.CHICKEN_BATCHES, batchId);
      if (!batch) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Chicken batch not found'
        });
      }

      const feedData = {
        batchId: sanitizeInput(batchId),
        batchName: batch.batchId,
        farmLocation: batch.farmLocation,
        quantity: parseFloat(quantity),
        feedType: sanitizeInput(feedType || 'chicken_feed'),
        cost: cost ? parseFloat(cost) : null,
        date: new Date(date),
        supplier: supplier ? sanitizeInput(supplier) : null,
        notes: notes ? sanitizeInput(notes) : null,
        recordedBy: req.user.uid,
        recordedAt: new Date()
      };

      const newRecord = await firebaseService.create('chicken_feed_records', feedData);
      
      // Update batch feed consumption stats
      await this.updateBatchFeedStats(batchId);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { feedRecord: newRecord },
        message: 'Chicken feed record created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  async getBatchEggRecords(batchId) {
    return await firebaseService.getAll(COLLECTIONS.EGG_RECORDS, { batchId });
  }

  async getBatchFeedRecords(batchId) {
    return await firebaseService.getAll('chicken_feed_records', { batchId });
  }

  async checkExistingEggRecord(batchId, date) {
    const records = await firebaseService.query(COLLECTIONS.EGG_RECORDS, [
      ['batchId', '==', batchId],
      ['date', '==', new Date(date)]
    ]);
    return records.length > 0 ? records[0] : null;
  }

  calculateAverageEggsPerDay(eggRecords, startDate) {
    if (eggRecords.length === 0) return 0;
    
    const totalEggs = eggRecords.reduce((sum, record) => sum + record.quantity, 0);
    const daysSinceStart = Math.max(1, Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)));
    
    return Math.round((totalEggs / daysSinceStart) * 100) / 100;
  }

  async updateBatchEggStats(batchId) {
    try {
      const eggRecords = await firebaseService.getAll(COLLECTIONS.EGG_RECORDS, { batchId });
      const batch = await firebaseService.getById(COLLECTIONS.CHICKEN_BATCHES, batchId);
      
      if (!batch) return;

      const totalEggs = eggRecords.reduce((sum, record) => sum + record.quantity, 0);
      const averageEggsPerDay = this.calculateAverageEggsPerDay(eggRecords, batch.dateAcquired);
      
      const productionStats = {
        ...batch.productionStats,
        averageEggsPerDay
      };

      // Determine if egg production has started
      if (eggRecords.length > 0 && !productionStats.startedLayingDate) {
        const firstRecord = eggRecords.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        productionStats.startedLayingDate = firstRecord.date;
      }

      await firebaseService.update(COLLECTIONS.CHICKEN_BATCHES, batchId, {
        totalEggsProduced: totalEggs,
        productionStats
      });
    } catch (error) {
      console.error('Error updating batch egg stats:', error);
    }
  }

  async updateBatchFeedStats(batchId) {
    try {
      const feedRecords = await firebaseService.getAll('chicken_feed_records', { batchId });
      const batch = await firebaseService.getById(COLLECTIONS.CHICKEN_BATCHES, batchId);
      
      if (!batch) return;

      const totalFeed = feedRecords.reduce((sum, record) => sum + record.quantity, 0);
      const daysSinceStart = Math.max(1, Math.floor((new Date() - new Date(batch.dateAcquired)) / (1000 * 60 * 60 * 24)));
      const averagePerDay = Math.round((totalFeed / daysSinceStart) * 100) / 100;

      const feedConsumption = {
        totalQuantity: totalFeed,
        averagePerDay
      };

      await firebaseService.update(COLLECTIONS.CHICKEN_BATCHES, batchId, { feedConsumption });
    } catch (error) {
      console.error('Error updating batch feed stats:', error);
    }
  }

  calculateEggStats(records, period) {
    const stats = {
      totalQuantity: 0,
      totalRecords: records.length,
      averagePerRecord: 0,
      dailyBreakdown: {},
      batchBreakdown: {},
      periodSummary: {}
    };

    records.forEach(record => {
      stats.totalQuantity += record.quantity;
      
      // Daily breakdown
      const dateKey = formatDate(record.date);
      if (!stats.dailyBreakdown[dateKey]) {
        stats.dailyBreakdown[dateKey] = 0;
      }
      stats.dailyBreakdown[dateKey] += record.quantity;
      
      // Batch breakdown
      if (!stats.batchBreakdown[record.batchId]) {
        stats.batchBreakdown[record.batchId] = {
          batchName: record.batchName,
          quantity: 0,
          records: 0
        };
      }
      stats.batchBreakdown[record.batchId].quantity += record.quantity;
      stats.batchBreakdown[record.batchId].records += 1;
    });

    stats.averagePerRecord = stats.totalRecords > 0 ? 
      Math.round((stats.totalQuantity / stats.totalRecords) * 100) / 100 : 0;

    const dailyValues = Object.values(stats.dailyBreakdown);
    if (dailyValues.length > 0) {
      stats.periodSummary = {
        averageDaily: Math.round((dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length) * 100) / 100,
        maxDaily: Math.max(...dailyValues),
        minDaily: Math.min(...dailyValues),
        totalDays: dailyValues.length
      };
    }

    return stats;
  }
}

module.exports = new ChickenController();