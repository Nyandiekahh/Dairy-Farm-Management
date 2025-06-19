const firebaseService = require('../services/firebaseService');
const { HTTP_STATUS, ERROR_MESSAGES, COLLECTIONS } = require('../utils/constants');
const { sanitizeInput, formatDate } = require('../utils/helpers');
const { getDateRanges } = require('../utils/dateUtils');

class MilkController {
  async getAllMilkRecords(req, res, next) {
    try {
      const { page = 1, limit = 10, cowId, farmLocation, date, session, period = 'daily' } = req.query;
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
      if (session) filters.session = session;
      
      let milkRecords;
      
      if (date) {
        // Get records for specific date
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        milkRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.MILK_RECORDS,
          'date',
          startDate,
          endDate,
          filters
        );
        
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: { milkRecords }
        });
      } else {
        // Get paginated records
        const result = await firebaseService.getWithPagination(
          COLLECTIONS.MILK_RECORDS,
          filters,
          parseInt(page),
          parseInt(limit),
          'date',
          'desc'
        );
        
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: {
            milkRecords: result.documents,
            pagination: result.pagination
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async getMilkRecordById(req, res, next) {
    try {
      const { id } = req.params;
      
      const milkRecord = await firebaseService.getById(COLLECTIONS.MILK_RECORDS, id);
      
      if (!milkRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Milk record not found'
        });
      }

      // Get cow details
      const cow = await firebaseService.getById(COLLECTIONS.COWS, milkRecord.cowId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          milkRecord: {
            ...milkRecord,
            cow: cow ? { id: cow.id, name: cow.name, earTagNumber: cow.earTagNumber } : null
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createMilkRecord(req, res, next) {
    try {
      const { cowId, quantity, session, date, notes, recordedBy } = req.body;
      
      // Verify cow exists
      const cow = await firebaseService.getById(COLLECTIONS.COWS, cowId);
      if (!cow) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.COW_NOT_FOUND
        });
      }

      // Check if record already exists for this cow, date, and session
      const existingRecord = await this.checkExistingRecord(cowId, date, session);
      if (existingRecord) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: 'Milk record already exists for this cow, date, and session'
        });
      }

      const milkData = {
        cowId: sanitizeInput(cowId),
        cowName: cow.name,
        earTagNumber: cow.earTagNumber,
        farmLocation: cow.farmLocation,
        quantity: parseFloat(quantity),
        session: sanitizeInput(session),
        date: new Date(date),
        notes: notes ? sanitizeInput(notes) : null,
        recordedBy: recordedBy || req.user.uid,
        recordedAt: new Date()
      };

      const newRecord = await firebaseService.create(COLLECTIONS.MILK_RECORDS, milkData);
      
      // Update cow's milk statistics
      await this.updateCowMilkStats(cowId);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { milkRecord: newRecord },
        message: 'Milk record created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMilkRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity, session, date, notes } = req.body;
      
      const updateData = {};
      if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
      if (session) updateData.session = sanitizeInput(session);
      if (date) updateData.date = new Date(date);
      if (notes !== undefined) updateData.notes = notes ? sanitizeInput(notes) : null;
      updateData.lastModifiedBy = req.user.uid;
      updateData.lastModifiedAt = new Date();

      const updatedRecord = await firebaseService.update(COLLECTIONS.MILK_RECORDS, id, updateData);
      
      if (!updatedRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Milk record not found'
        });
      }

      // Update cow's milk statistics
      await this.updateCowMilkStats(updatedRecord.cowId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { milkRecord: updatedRecord },
        message: 'Milk record updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMilkRecord(req, res, next) {
    try {
      const { id } = req.params;
      
      const milkRecord = await firebaseService.getById(COLLECTIONS.MILK_RECORDS, id);
      if (!milkRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Milk record not found'
        });
      }

      await firebaseService.delete(COLLECTIONS.MILK_RECORDS, id);
      
      // Update cow's milk statistics
      await this.updateCowMilkStats(milkRecord.cowId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Milk record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getMilkRecordsByCow(req, res, next) {
    try {
      const { cowId } = req.params;
      const { startDate, endDate, session } = req.query;
      
      const filters = { cowId };
      if (session) filters.session = session;
      
      let milkRecords;
      
      if (startDate && endDate) {
        milkRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.MILK_RECORDS,
          'date',
          new Date(startDate),
          new Date(endDate),
          filters
        );
      } else {
        milkRecords = await firebaseService.getAll(COLLECTIONS.MILK_RECORDS, filters);
      }
      
      // Sort by date descending
      milkRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { milkRecords }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMilkStats(req, res, next) {
    try {
      const { farmLocation, period = 'daily', startDate, endDate, cowId } = req.query;
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
      
      let milkRecords;
      
      if (startDate && endDate) {
        milkRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.MILK_RECORDS,
          'date',
          new Date(startDate),
          new Date(endDate),
          filters
        );
      } else {
        // Get records for the specified period
        const dateRange = getDateRanges(period);
        milkRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.MILK_RECORDS,
          'date',
          dateRange.start,
          dateRange.end,
          filters
        );
      }
      
      const stats = this.calculateMilkStats(milkRecords, period);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMilkSales(req, res, next) {
    try {
      const { farmLocation, startDate, endDate } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      // Only admins can view sales data
      if (userRole !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN
        });
      }
      
      const filters = { type: 'sale' };
      if (farmLocation) filters.farmLocation = farmLocation;
      
      let salesRecords;
      
      if (startDate && endDate) {
        salesRecords = await firebaseService.queryWithDateRange(
          'milk_sales',
          'date',
          new Date(startDate),
          new Date(endDate),
          filters
        );
      } else {
        salesRecords = await firebaseService.getAll('milk_sales', filters);
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { salesRecords }
      });
    } catch (error) {
      next(error);
    }
  }

  async createMilkSale(req, res, next) {
    try {
      const { farmLocation, quantity, pricePerLitre, totalAmount, date, buyer, notes } = req.body;
      
      const saleData = {
        farmLocation: sanitizeInput(farmLocation),
        quantity: parseFloat(quantity),
        pricePerLitre: parseFloat(pricePerLitre),
        totalAmount: parseFloat(totalAmount),
        date: new Date(date),
        buyer: buyer ? sanitizeInput(buyer) : null,
        notes: notes ? sanitizeInput(notes) : null,
        type: 'sale',
        recordedBy: req.user.uid,
        recordedAt: new Date()
      };

      const newSale = await firebaseService.create('milk_sales', saleData);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { sale: newSale },
        message: 'Milk sale recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  async checkExistingRecord(cowId, date, session) {
    const records = await firebaseService.query(COLLECTIONS.MILK_RECORDS, [
      ['cowId', '==', cowId],
      ['date', '==', new Date(date)],
      ['session', '==', session]
    ]);
    return records.length > 0 ? records[0] : null;
  }

  async updateCowMilkStats(cowId) {
    try {
      const milkRecords = await firebaseService.getAll(COLLECTIONS.MILK_RECORDS, { cowId });
      
      if (milkRecords.length === 0) {
        await firebaseService.update(COLLECTIONS.COWS, cowId, {
          totalMilkProduced: 0,
          averageDailyMilk: 0,
          lastMilkingDate: null
        });
        return;
      }

      const totalMilk = milkRecords.reduce((sum, record) => sum + record.quantity, 0);
      
      // Group by date to calculate daily totals
      const dailyTotals = {};
      milkRecords.forEach(record => {
        const dateKey = formatDate(record.date);
        if (!dailyTotals[dateKey]) {
          dailyTotals[dateKey] = 0;
        }
        dailyTotals[dateKey] += record.quantity;
      });
      
      const averageDailyMilk = totalMilk / Object.keys(dailyTotals).length;
      const lastMilkingDate = new Date(Math.max(...milkRecords.map(r => new Date(r.date))));
      
      await firebaseService.update(COLLECTIONS.COWS, cowId, {
        totalMilkProduced: totalMilk,
        averageDailyMilk: Math.round(averageDailyMilk * 100) / 100,
        lastMilkingDate
      });
    } catch (error) {
      console.error('Error updating cow milk stats:', error);
    }
  }

  calculateMilkStats(records, period) {
    const stats = {
      totalQuantity: 0,
      totalRecords: records.length,
      averagePerRecord: 0,
      dailyBreakdown: {},
      sessionBreakdown: { morning: 0, afternoon: 0, evening: 0 },
      cowBreakdown: {},
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
      
      // Session breakdown
      if (stats.sessionBreakdown[record.session] !== undefined) {
        stats.sessionBreakdown[record.session] += record.quantity;
      }
      
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
    });

    stats.averagePerRecord = stats.totalRecords > 0 ? 
      Math.round((stats.totalQuantity / stats.totalRecords) * 100) / 100 : 0;

    // Calculate period-specific stats
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

module.exports = new MilkController();