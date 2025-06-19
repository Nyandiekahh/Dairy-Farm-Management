const firebaseService = require('../services/firebaseService');
const { HTTP_STATUS, ERROR_MESSAGES, COLLECTIONS } = require('../utils/constants');
const { getDateRanges } = require('../utils/dateUtils');
const { formatDate, groupBy } = require('../utils/helpers');

class StatsController {
  async getDashboardStats(req, res, next) {
    try {
      const { farmLocation, period = 'monthly' } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const filters = {};
      
      // Apply farm filter based on user role
      if (userRole === 'farmer') {
        filters.farmLocation = userFarm;
      } else if (farmLocation) {
        filters.farmLocation = farmLocation;
      }
      
      const dateRange = getDateRanges(period);
      
      // Get all necessary data in parallel
      const [
        cows,
        chickenBatches,
        milkRecords,
        eggRecords,
        feedRecords,
        healthRecords
      ] = await Promise.all([
        firebaseService.getAll(COLLECTIONS.COWS, { ...filters, isActive: true }),
        firebaseService.getAll(COLLECTIONS.CHICKEN_BATCHES, { ...filters, isActive: true }),
        firebaseService.queryWithDateRange(COLLECTIONS.MILK_RECORDS, 'date', dateRange.start, dateRange.end, filters),
        firebaseService.queryWithDateRange(COLLECTIONS.EGG_RECORDS, 'date', dateRange.start, dateRange.end, filters),
        firebaseService.queryWithDateRange(COLLECTIONS.FEED_RECORDS, 'date', dateRange.start, dateRange.end, filters),
        userRole === 'admin' ? 
          firebaseService.queryWithDateRange(COLLECTIONS.HEALTH_RECORDS, 'dateOfIllness', dateRange.start, dateRange.end, filters) 
          : []
      ]);

      const dashboardStats = {
        livestock: {
          totalCows: cows.length,
          activeCows: cows.filter(cow => cow.isActive).length,
          totalChickenBatches: chickenBatches.length,
          totalChickens: chickenBatches.reduce((sum, batch) => sum + batch.currentCount, 0)
        },
        production: {
          milk: this.calculateMilkProductionStats(milkRecords),
          eggs: this.calculateEggProductionStats(eggRecords)
        },
        feed: this.calculateFeedStats(feedRecords),
        health: userRole === 'admin' ? this.calculateHealthStats(healthRecords) : null,
        trends: {
          milkTrend: this.calculateTrend(milkRecords, 'quantity'),
          eggTrend: this.calculateTrend(eggRecords, 'quantity')
        },
        alerts: await this.generateAlerts(filters, userRole)
      };

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { dashboardStats }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductionStats(req, res, next) {
    try {
      const { farmLocation, startDate, endDate, type } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const filters = {};
      
      if (userRole === 'farmer') {
        filters.farmLocation = userFarm;
      } else if (farmLocation) {
        filters.farmLocation = farmLocation;
      }

      let stats = {};

      if (!type || type === 'milk') {
        const milkRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.MILK_RECORDS,
          'date',
          new Date(startDate),
          new Date(endDate),
          filters
        );
        stats.milk = this.calculateDetailedMilkStats(milkRecords);
      }

      if (!type || type === 'eggs') {
        const eggRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.EGG_RECORDS,
          'date',
          new Date(startDate),
          new Date(endDate),
          filters
        );
        stats.eggs = this.calculateDetailedEggStats(eggRecords);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { productionStats: stats }
      });
    } catch (error) {
      next(error);
    }
  }

  async getFinancialStats(req, res, next) {
    try {
      const { farmLocation, startDate, endDate } = req.query;
      const userRole = req.userRole;
      
      // Only admins can view financial stats
      if (userRole !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN
        });
      }

      const filters = {};
      if (farmLocation) filters.farmLocation = farmLocation;

      const [milkSales, feedInventory, healthRecords] = await Promise.all([
        firebaseService.queryWithDateRange(
          'milk_sales',
          'date',
          new Date(startDate),
          new Date(endDate),
          filters
        ),
        firebaseService.getAll(COLLECTIONS.FEED_INVENTORY, filters),
        firebaseService.queryWithDateRange(
          COLLECTIONS.HEALTH_RECORDS,
          'dateOfIllness',
          new Date(startDate),
          new Date(endDate),
          filters
        )
      ]);

      const financialStats = {
        revenue: {
          milkSales: milkSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
          totalTransactions: milkSales.length
        },
        expenses: {
          feedCosts: feedInventory.reduce((sum, item) => sum + ((item.purchasePrice || 0) + (item.transportCost || 0)), 0),
         healthCosts: healthRecords.reduce((sum, record) => sum + (record.cost || 0), 0),
         totalFeedItems: feedInventory.length,
         totalHealthRecords: healthRecords.length
       },
       profitability: {
         grossRevenue: 0,
         totalExpenses: 0,
         netProfit: 0,
         profitMargin: 0
       },
       breakdown: {
         milkSalesByMonth: this.groupByMonth(milkSales, 'date', 'totalAmount'),
         feedCostsByMonth: this.groupByMonth(feedInventory, 'purchaseDate', 'purchasePrice'),
         healthCostsByMonth: this.groupByMonth(healthRecords, 'dateOfIllness', 'cost')
       }
     };

     // Calculate profitability
     financialStats.profitability.grossRevenue = financialStats.revenue.milkSales;
     financialStats.profitability.totalExpenses = financialStats.expenses.feedCosts + financialStats.expenses.healthCosts;
     financialStats.profitability.netProfit = financialStats.profitability.grossRevenue - financialStats.profitability.totalExpenses;
     financialStats.profitability.profitMargin = financialStats.profitability.grossRevenue > 0 ? 
       Math.round((financialStats.profitability.netProfit / financialStats.profitability.grossRevenue) * 100) : 0;

     res.status(HTTP_STATUS.OK).json({
       success: true,
       data: { financialStats }
     });
   } catch (error) {
     next(error);
   }
 }

 async getPerformanceStats(req, res, next) {
   try {
     const { farmLocation, period = 'monthly' } = req.query;
     const userRole = req.userRole;
     const userFarm = req.userFarm;
     
     const filters = {};
     
     if (userRole === 'farmer') {
       filters.farmLocation = userFarm;
     } else if (farmLocation) {
       filters.farmLocation = farmLocation;
     }

     const dateRange = getDateRanges(period);

     const [cows, milkRecords, chickenBatches, eggRecords] = await Promise.all([
       firebaseService.getAll(COLLECTIONS.COWS, { ...filters, isActive: true }),
       firebaseService.queryWithDateRange(COLLECTIONS.MILK_RECORDS, 'date', dateRange.start, dateRange.end, filters),
       firebaseService.getAll(COLLECTIONS.CHICKEN_BATCHES, { ...filters, isActive: true }),
       firebaseService.queryWithDateRange(COLLECTIONS.EGG_RECORDS, 'date', dateRange.start, dateRange.end, filters)
     ]);

     const performanceStats = {
       cowPerformance: this.calculateCowPerformance(cows, milkRecords),
       chickenPerformance: this.calculateChickenPerformance(chickenBatches, eggRecords),
       topPerformers: {
         cows: this.getTopPerformingCows(cows, milkRecords, 5),
         chickenBatches: this.getTopPerformingBatches(chickenBatches, eggRecords, 5)
       },
       productivity: {
         milkProductivityPerCow: cows.length > 0 ? 
           Math.round((milkRecords.reduce((sum, r) => sum + r.quantity, 0) / cows.length) * 100) / 100 : 0,
         eggProductivityPerBatch: chickenBatches.length > 0 ? 
           Math.round((eggRecords.reduce((sum, r) => sum + r.quantity, 0) / chickenBatches.length) * 100) / 100 : 0
       }
     };

     res.status(HTTP_STATUS.OK).json({
       success: true,
       data: { performanceStats }
     });
   } catch (error) {
     next(error);
   }
 }

 async getComparisonStats(req, res, next) {
   try {
     const { period1Start, period1End, period2Start, period2End, farmLocation } = req.query;
     const userRole = req.userRole;
     const userFarm = req.userFarm;
     
     const filters = {};
     
     if (userRole === 'farmer') {
       filters.farmLocation = userFarm;
     } else if (farmLocation) {
       filters.farmLocation = farmLocation;
     }

     const [
       period1Milk,
       period1Eggs,
       period2Milk,
       period2Eggs
     ] = await Promise.all([
       firebaseService.queryWithDateRange(COLLECTIONS.MILK_RECORDS, 'date', new Date(period1Start), new Date(period1End), filters),
       firebaseService.queryWithDateRange(COLLECTIONS.EGG_RECORDS, 'date', new Date(period1Start), new Date(period1End), filters),
       firebaseService.queryWithDateRange(COLLECTIONS.MILK_RECORDS, 'date', new Date(period2Start), new Date(period2End), filters),
       firebaseService.queryWithDateRange(COLLECTIONS.EGG_RECORDS, 'date', new Date(period2Start), new Date(period2End), filters)
     ]);

     const comparisonStats = {
       milk: {
         period1: this.calculateMilkProductionStats(period1Milk),
         period2: this.calculateMilkProductionStats(period2Milk),
         change: this.calculateChange(
           period1Milk.reduce((sum, r) => sum + r.quantity, 0),
           period2Milk.reduce((sum, r) => sum + r.quantity, 0)
         )
       },
       eggs: {
         period1: this.calculateEggProductionStats(period1Eggs),
         period2: this.calculateEggProductionStats(period2Eggs),
         change: this.calculateChange(
           period1Eggs.reduce((sum, r) => sum + r.quantity, 0),
           period2Eggs.reduce((sum, r) => sum + r.quantity, 0)
         )
       }
     };

     res.status(HTTP_STATUS.OK).json({
       success: true,
       data: { comparisonStats }
     });
   } catch (error) {
     next(error);
   }
 }

 async getCustomReport(req, res, next) {
   try {
     const { farmLocation, startDate, endDate, includeTypes } = req.body;
     const userRole = req.userRole;
     const userFarm = req.userFarm;
     
     const filters = {};
     
     if (userRole === 'farmer') {
       filters.farmLocation = userFarm;
     } else if (farmLocation) {
       filters.farmLocation = farmLocation;
     }

     const report = {
       reportGenerated: new Date(),
       period: { startDate, endDate },
       farmLocation: filters.farmLocation || 'All Farms'
     };

     // Include requested data types
     if (includeTypes.includes('livestock')) {
       const [cows, chickenBatches] = await Promise.all([
         firebaseService.getAll(COLLECTIONS.COWS, filters),
         firebaseService.getAll(COLLECTIONS.CHICKEN_BATCHES, filters)
       ]);
       
       report.livestock = {
         cows: cows.length,
         activeCows: cows.filter(c => c.isActive).length,
         chickenBatches: chickenBatches.length,
         totalChickens: chickenBatches.reduce((sum, b) => sum + b.currentCount, 0),
         cowBreeds: this.groupByField(cows, 'breed'),
         chickenBreeds: this.groupByField(chickenBatches, 'breed')
       };
     }

     if (includeTypes.includes('production')) {
       const [milkRecords, eggRecords] = await Promise.all([
         firebaseService.queryWithDateRange(COLLECTIONS.MILK_RECORDS, 'date', new Date(startDate), new Date(endDate), filters),
         firebaseService.queryWithDateRange(COLLECTIONS.EGG_RECORDS, 'date', new Date(startDate), new Date(endDate), filters)
       ]);
       
       report.production = {
         milk: this.calculateDetailedMilkStats(milkRecords),
         eggs: this.calculateDetailedEggStats(eggRecords)
       };
     }

     if (includeTypes.includes('health') && userRole === 'admin') {
       const healthRecords = await firebaseService.queryWithDateRange(
         COLLECTIONS.HEALTH_RECORDS,
         'dateOfIllness',
         new Date(startDate),
         new Date(endDate),
         filters
       );
       
       report.health = this.calculateDetailedHealthStats(healthRecords);
     }

     if (includeTypes.includes('feed')) {
       const feedRecords = await firebaseService.queryWithDateRange(
         COLLECTIONS.FEED_RECORDS,
         'date',
         new Date(startDate),
         new Date(endDate),
         filters
       );
       
       report.feed = this.calculateDetailedFeedStats(feedRecords);
     }

     res.status(HTTP_STATUS.OK).json({
       success: true,
       data: { customReport: report }
     });
   } catch (error) {
     next(error);
   }
 }

 // Helper methods
 calculateMilkProductionStats(records) {
   const total = records.reduce((sum, record) => sum + record.quantity, 0);
   const dailyTotals = groupBy(records, record => formatDate(record.date));
   const dailyAverages = Object.values(dailyTotals).map(dayRecords => 
     dayRecords.reduce((sum, r) => sum + r.quantity, 0)
   );

   return {
     totalQuantity: total,
     totalRecords: records.length,
     averagePerDay: dailyAverages.length > 0 ? 
       Math.round((dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.length) * 100) / 100 : 0,
     maxDaily: dailyAverages.length > 0 ? Math.max(...dailyAverages) : 0,
     minDaily: dailyAverages.length > 0 ? Math.min(...dailyAverages) : 0
   };
 }

 calculateEggProductionStats(records) {
   const total = records.reduce((sum, record) => sum + record.quantity, 0);
   const dailyTotals = groupBy(records, record => formatDate(record.date));
   const dailyAverages = Object.values(dailyTotals).map(dayRecords => 
     dayRecords.reduce((sum, r) => sum + r.quantity, 0)
   );

   return {
     totalQuantity: total,
     totalRecords: records.length,
     averagePerDay: dailyAverages.length > 0 ? 
       Math.round((dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.length) * 100) / 100 : 0,
     maxDaily: dailyAverages.length > 0 ? Math.max(...dailyAverages) : 0,
     minDaily: dailyAverages.length > 0 ? Math.min(...dailyAverages) : 0
   };
 }

 calculateFeedStats(records) {
   const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0);
   const feedTypes = groupBy(records, 'feedType');
   
   return {
     totalQuantity,
     totalRecords: records.length,
     feedTypeBreakdown: Object.keys(feedTypes).reduce((breakdown, type) => {
       breakdown[type] = {
         quantity: feedTypes[type].reduce((sum, r) => sum + r.quantity, 0),
         records: feedTypes[type].length
       };
       return breakdown;
     }, {})
   };
 }

 calculateHealthStats(records) {
   if (!records) return null;
   
   const totalCost = records.reduce((sum, record) => sum + (record.cost || 0), 0);
   const resolvedCases = records.filter(r => r.isResolved).length;
   
   return {
     totalRecords: records.length,
     resolvedCases,
     unresolvedCases: records.length - resolvedCases,
     totalCost,
     averageCostPerCase: records.length > 0 ? Math.round((totalCost / records.length) * 100) / 100 : 0,
     resolutionRate: records.length > 0 ? Math.round((resolvedCases / records.length) * 100) : 0
   };
 }

 calculateTrend(records, field) {
   if (records.length < 2) return { direction: 'stable', percentage: 0 };
   
   const sortedRecords = records.sort((a, b) => new Date(a.date) - new Date(b.date));
   const firstHalf = sortedRecords.slice(0, Math.floor(sortedRecords.length / 2));
   const secondHalf = sortedRecords.slice(Math.floor(sortedRecords.length / 2));
   
   const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r[field], 0) / firstHalf.length;
   const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r[field], 0) / secondHalf.length;
   
   if (firstHalfAvg === 0) return { direction: 'stable', percentage: 0 };
   
   const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
   
   return {
     direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
     percentage: Math.round(Math.abs(change))
   };
 }

 async generateAlerts(filters, userRole) {
   const alerts = [];
   
   try {
     // Low-producing cows alert
     const cows = await firebaseService.getAll(COLLECTIONS.COWS, { ...filters, isActive: true });
     const lowProducingCows = cows.filter(cow => cow.averageDailyMilk < 5); // Less than 5L per day
     
     if (lowProducingCows.length > 0) {
       alerts.push({
         type: 'warning',
         title: 'Low Milk Production',
         message: `${lowProducingCows.length} cows are producing less than 5L milk per day`,
         count: lowProducingCows.length
       });
     }

     // Health alerts (admin only)
     if (userRole === 'admin') {
       const unresolvedHealth = await firebaseService.getAll(COLLECTIONS.HEALTH_RECORDS, { 
         ...filters, 
         isResolved: false 
       });
       
       if (unresolvedHealth.length > 0) {
         alerts.push({
           type: 'error',
           title: 'Unresolved Health Issues',
           message: `${unresolvedHealth.length} health issues need attention`,
           count: unresolvedHealth.length
         });
       }

       // Feed inventory alerts
       const lowInventory = await firebaseService.getAll(COLLECTIONS.FEED_INVENTORY, {
         ...filters,
         needsRestock: true
       });
       
       if (lowInventory.length > 0) {
         alerts.push({
           type: 'warning',
           title: 'Feed Restock Needed',
           message: `${lowInventory.length} feed items need restocking`,
           count: lowInventory.length
         });
       }
     }

     // Old chickens alert
     const chickenBatches = await firebaseService.getAll(COLLECTIONS.CHICKEN_BATCHES, { ...filters, isActive: true });
     const oldBatches = chickenBatches.filter(batch => {
       const daysSinceAcquired = Math.floor((new Date() - new Date(batch.dateAcquired)) / (1000 * 60 * 60 * 24));
       return daysSinceAcquired > (batch.expectedLifespan || 365);
     });
     
     if (oldBatches.length > 0) {
       alerts.push({
         type: 'info',
         title: 'Aging Chicken Batches',
         message: `${oldBatches.length} chicken batches are past expected lifespan`,
         count: oldBatches.length
       });
     }

   } catch (error) {
     console.error('Error generating alerts:', error);
   }
   
   return alerts;
 }

 calculateChange(oldValue, newValue) {
   if (oldValue === 0) return newValue > 0 ? 100 : 0;
   return Math.round(((newValue - oldValue) / oldValue) * 100);
 }

 groupByMonth(records, dateField, valueField) {
   const grouped = {};
   records.forEach(record => {
     const month = new Date(record[dateField]).toISOString().slice(0, 7);
     if (!grouped[month]) grouped[month] = 0;
     grouped[month] += record[valueField] || 0;
   });
   return grouped;
 }

 groupByField(records, field) {
   return records.reduce((groups, record) => {
     const key = record[field] || 'Unknown';
     groups[key] = (groups[key] || 0) + 1;
     return groups;
   }, {});
 }

 calculateCowPerformance(cows, milkRecords) {
   const cowMilkData = groupBy(milkRecords, 'cowId');
   
   return cows.map(cow => {
     const cowRecords = cowMilkData[cow.id] || [];
     const totalMilk = cowRecords.reduce((sum, r) => sum + r.quantity, 0);
     
     return {
       cowId: cow.id,
       cowName: cow.name,
       totalMilk,
       averageDaily: cow.averageDailyMilk || 0,
       recordCount: cowRecords.length
     };
   }).sort((a, b) => b.totalMilk - a.totalMilk);
 }

 calculateChickenPerformance(batches, eggRecords) {
   const batchEggData = groupBy(eggRecords, 'batchId');
   
   return batches.map(batch => {
     const batchRecords = batchEggData[batch.id] || [];
     const totalEggs = batchRecords.reduce((sum, r) => sum + r.quantity, 0);
     
     return {
       batchId: batch.id,
       batchName: batch.batchId,
       totalEggs,
       averageDaily: batch.productionStats?.averageEggsPerDay || 0,
       recordCount: batchRecords.length
     };
   }).sort((a, b) => b.totalEggs - a.totalEggs);
 }

 getTopPerformingCows(cows, milkRecords, limit) {
   const performance = this.calculateCowPerformance(cows, milkRecords);
   return performance.slice(0, limit);
 }

 getTopPerformingBatches(batches, eggRecords, limit) {
   const performance = this.calculateChickenPerformance(batches, eggRecords);
   return performance.slice(0, limit);
 }

 calculateDetailedMilkStats(records) {
   const stats = this.calculateMilkProductionStats(records);
   stats.sessionBreakdown = groupBy(records, 'session');
   stats.cowBreakdown = groupBy(records, 'cowId');
   stats.weeklyTrend = this.calculateWeeklyTrend(records, 'quantity');
   return stats;
 }

 calculateDetailedEggStats(records) {
   const stats = this.calculateEggProductionStats(records);
   stats.batchBreakdown = groupBy(records, 'batchId');
   stats.weeklyTrend = this.calculateWeeklyTrend(records, 'quantity');
   return stats;
 }

 calculateDetailedHealthStats(records) {
   const stats = this.calculateHealthStats(records);
   stats.diseaseBreakdown = groupBy(records, 'disease');
   stats.vetBreakdown = groupBy(records, 'vetName');
   stats.monthlyTrend = this.calculateMonthlyTrend(records, 'cost');
   return stats;
 }

 calculateDetailedFeedStats(records) {
   const stats = this.calculateFeedStats(records);
   stats.cowBreakdown = groupBy(records, 'cowId');
   stats.weeklyTrend = this.calculateWeeklyTrend(records, 'quantity');
   return stats;
 }

 calculateWeeklyTrend(records, field) {
   const weeklyData = {};
   records.forEach(record => {
     const week = this.getWeekKey(new Date(record.date));
     if (!weeklyData[week]) weeklyData[week] = 0;
     weeklyData[week] += record[field];
   });
   return weeklyData;
 }

 calculateMonthlyTrend(records, field) {
   const monthlyData = {};
   records.forEach(record => {
     const month = new Date(record.date || record.dateOfIllness).toISOString().slice(0, 7);
     if (!monthlyData[month]) monthlyData[month] = 0;
     monthlyData[month] += record[field] || 0;
   });
   return monthlyData;
 }

 getWeekKey(date) {
   const year = date.getFullYear();
   const week = Math.ceil((((date - new Date(year, 0, 1)) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);
   return `${year}-W${week.toString().padStart(2, '0')}`;
 }
}

module.exports = new StatsController();