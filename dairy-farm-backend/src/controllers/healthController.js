const firebaseService = require('../services/firebaseService');
const { HTTP_STATUS, ERROR_MESSAGES, COLLECTIONS } = require('../utils/constants');
const { sanitizeInput, formatDate } = require('../utils/helpers');
const { getDateRanges } = require('../utils/dateUtils');

class HealthController {
  async getAllHealthRecords(req, res, next) {
    try {
      const { page = 1, limit = 10, cowId, farmLocation, disease, vetName } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      // Only admins can view health records
      if (userRole !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN
        });
      }
      
      const filters = {};
      if (farmLocation) filters.farmLocation = farmLocation;
      if (cowId) filters.cowId = cowId;
      if (disease) filters.disease = disease;
      if (vetName) filters.vetName = vetName;
      
      const result = await firebaseService.getWithPagination(
        COLLECTIONS.HEALTH_RECORDS,
        filters,
        parseInt(page),
        parseInt(limit),
        'dateOfIllness',
        'desc'
      );
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          healthRecords: result.documents,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getHealthRecordById(req, res, next) {
    try {
      const { id } = req.params;
      
      const healthRecord = await firebaseService.getById(COLLECTIONS.HEALTH_RECORDS, id);
      
      if (!healthRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Health record not found'
        });
      }

      // Get cow details
      const cow = await firebaseService.getById(COLLECTIONS.COWS, healthRecord.cowId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          healthRecord: {
            ...healthRecord,
            cow: cow ? { id: cow.id, name: cow.name, earTagNumber: cow.earTagNumber } : null
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createHealthRecord(req, res, next) {
    try {
      const {
        cowId,
        dateOfIllness,
        disease,
        symptoms,
        treatment,
        medicineUsed,
        dosage,
        cost,
        vetName,
        vetContact,
        dateOfTreatment,
        followUpDate,
        notes,
        isResolved
      } = req.body;
      
      // Verify cow exists
      const cow = await firebaseService.getById(COLLECTIONS.COWS, cowId);
      if (!cow) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.COW_NOT_FOUND
        });
      }

      const healthData = {
        cowId: sanitizeInput(cowId),
        cowName: cow.name,
        earTagNumber: cow.earTagNumber,
        farmLocation: cow.farmLocation,
        dateOfIllness: new Date(dateOfIllness),
        disease: sanitizeInput(disease),
        symptoms: symptoms ? sanitizeInput(symptoms) : null,
        treatment: sanitizeInput(treatment),
        medicineUsed: sanitizeInput(medicineUsed),
        dosage: dosage ? sanitizeInput(dosage) : null,
        cost: parseFloat(cost),
        vetName: sanitizeInput(vetName),
        vetContact: sanitizeInput(vetContact),
        dateOfTreatment: dateOfTreatment ? new Date(dateOfTreatment) : new Date(),
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes: notes ? sanitizeInput(notes) : null,
        isResolved: isResolved || false,
        recordedBy: req.user.uid,
        recordedAt: new Date()
      };

      const newRecord = await firebaseService.create(COLLECTIONS.HEALTH_RECORDS, healthData);
      
      // Update cow's health status
      await this.updateCowHealthStatus(cowId, disease, isResolved);
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: { healthRecord: newRecord },
        message: 'Health record created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateHealthRecord(req, res, next) {
    try {
      const { id } = req.params;
      const {
        disease,
        symptoms,
        treatment,
        medicineUsed,
        dosage,
        cost,
        vetName,
        vetContact,
        dateOfTreatment,
        followUpDate,
        notes,
        isResolved
      } = req.body;
      
      const updateData = {};
      if (disease) updateData.disease = sanitizeInput(disease);
      if (symptoms !== undefined) updateData.symptoms = symptoms ? sanitizeInput(symptoms) : null;
      if (treatment) updateData.treatment = sanitizeInput(treatment);
      if (medicineUsed) updateData.medicineUsed = sanitizeInput(medicineUsed);
      if (dosage !== undefined) updateData.dosage = dosage ? sanitizeInput(dosage) : null;
      if (cost !== undefined) updateData.cost = parseFloat(cost);
      if (vetName) updateData.vetName = sanitizeInput(vetName);
      if (vetContact) updateData.vetContact = sanitizeInput(vetContact);
      if (dateOfTreatment) updateData.dateOfTreatment = new Date(dateOfTreatment);
      if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
      if (notes !== undefined) updateData.notes = notes ? sanitizeInput(notes) : null;
      if (isResolved !== undefined) updateData.isResolved = isResolved;
      updateData.lastModifiedBy = req.user.uid;
      updateData.lastModifiedAt = new Date();

      const updatedRecord = await firebaseService.update(COLLECTIONS.HEALTH_RECORDS, id, updateData);
      
      if (!updatedRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Health record not found'
        });
      }

      // Update cow's health status if resolution status changed
      if (isResolved !== undefined) {
        await this.updateCowHealthStatus(updatedRecord.cowId, updatedRecord.disease, isResolved);
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { healthRecord: updatedRecord },
        message: 'Health record updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteHealthRecord(req, res, next) {
    try {
      const { id } = req.params;
      
      const healthRecord = await firebaseService.getById(COLLECTIONS.HEALTH_RECORDS, id);
      if (!healthRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Health record not found'
        });
      }

      await firebaseService.delete(COLLECTIONS.HEALTH_RECORDS, id);
      
      // Update cow's health status
      await this.recalculateCowHealthStatus(healthRecord.cowId);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Health record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getHealthRecordsByCow(req, res, next) {
    try {
      const { cowId } = req.params;
      const { startDate, endDate, isResolved } = req.query;
      
      const filters = { cowId };
      if (isResolved !== undefined) filters.isResolved = isResolved === 'true';
      
      let healthRecords;
      
      if (startDate && endDate) {
        healthRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.HEALTH_RECORDS,
          'dateOfIllness',
          new Date(startDate),
          new Date(endDate),
          filters
        );
      } else {
        healthRecords = await firebaseService.getAll(COLLECTIONS.HEALTH_RECORDS, filters);
      }
      
      // Sort by date of illness descending
      healthRecords.sort((a, b) => new Date(b.dateOfIllness) - new Date(a.dateOfIllness));
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { healthRecords }
      });
    } catch (error) {
      next(error);
    }
  }

  async getHealthStats(req, res, next) {
    try {
      const { farmLocation, period = 'monthly', startDate, endDate } = req.query;
      
      const filters = {};
      if (farmLocation) filters.farmLocation = farmLocation;
      
      let healthRecords;
      
      if (startDate && endDate) {
        healthRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.HEALTH_RECORDS,
          'dateOfIllness',
          new Date(startDate),
          new Date(endDate),
          filters
        );
      } else {
        const dateRange = getDateRanges(period);
        healthRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.HEALTH_RECORDS,
          'dateOfIllness',
          dateRange.start,
          dateRange.end,
          filters
        );
      }
      
      const stats = this.calculateHealthStats(healthRecords);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }

  async getVeterinarianStats(req, res, next) {
    try {
      const { farmLocation, startDate, endDate } = req.query;
      
      const filters = {};
      if (farmLocation) filters.farmLocation = farmLocation;
      
      let healthRecords;
      
      if (startDate && endDate) {
        healthRecords = await firebaseService.queryWithDateRange(
          COLLECTIONS.HEALTH_RECORDS,
          'dateOfIllness',
          new Date(startDate),
          new Date(endDate),
          filters
        );
      } else {
        healthRecords = await firebaseService.getAll(COLLECTIONS.HEALTH_RECORDS, filters);
      }
      
      const vetStats = this.calculateVeterinarianStats(healthRecords);
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { veterinarianStats: vetStats }
      });
    } catch (error) {
      next(error);
    }
  }

  async scheduleFollowUp(req, res, next) {
    try {
      const { id } = req.params;
      const { followUpDate, notes } = req.body;
      
      const updateData = {
        followUpDate: new Date(followUpDate),
        followUpScheduledBy: req.user.uid,
        followUpScheduledAt: new Date()
      };
      
      if (notes) updateData.followUpNotes = sanitizeInput(notes);

      const updatedRecord = await firebaseService.update(COLLECTIONS.HEALTH_RECORDS, id, updateData);
      
      if (!updatedRecord) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Health record not found'
        });
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { healthRecord: updatedRecord },
        message: 'Follow-up scheduled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  async updateCowHealthStatus(cowId, disease, isResolved) {
    try {
      const cow = await firebaseService.getById(COLLECTIONS.COWS, cowId);
      if (!cow) return;

      const healthStatus = cow.healthStatus || {};
      
      if (isResolved) {
        healthStatus.currentCondition = 'healthy';
        healthStatus.lastCheckup = new Date();
      } else {
        healthStatus.currentCondition = 'sick';
        healthStatus.currentIllness = disease;
        healthStatus.lastCheckup = new Date();
      }

      await firebaseService.update(COLLECTIONS.COWS, cowId, { healthStatus });
    } catch (error) {
      console.error('Error updating cow health status:', error);
    }
  }

  async recalculateCowHealthStatus(cowId) {
    try {
      const unresolvedRecords = await firebaseService.getAll(COLLECTIONS.HEALTH_RECORDS, {
        cowId,
        isResolved: false
      });

      const cow = await firebaseService.getById(COLLECTIONS.COWS, cowId);
      if (!cow) return;

      const healthStatus = cow.healthStatus || {};
      
      if (unresolvedRecords.length > 0) {
        // Still has unresolved health issues
        const latestRecord = unresolvedRecords.sort((a, b) => 
          new Date(b.dateOfIllness) - new Date(a.dateOfIllness))[0];
        
        healthStatus.currentCondition = 'sick';
        healthStatus.currentIllness = latestRecord.disease;
      } else {
        // No unresolved health issues
        healthStatus.currentCondition = 'healthy';
        healthStatus.currentIllness = null;
      }
      
      healthStatus.lastCheckup = new Date();
      await firebaseService.update(COLLECTIONS.COWS, cowId, { healthStatus });
    } catch (error) {
      console.error('Error recalculating cow health status:', error);
    }
  }

  calculateHealthStats(records) {
    const stats = {
      totalRecords: records.length,
      resolvedCases: 0,
      unresolvedCases: 0,
      totalCost: 0,
      diseaseBreakdown: {},
      medicineBreakdown: {},
      vetBreakdown: {},
      monthlyBreakdown: {},
      averageCostPerCase: 0,
      resolutionRate: 0
    };

    records.forEach(record => {
      if (record.isResolved) {
        stats.resolvedCases++;
      } else {
        stats.unresolvedCases++;
      }

      stats.totalCost += record.cost || 0;

      // Disease breakdown
      if (!stats.diseaseBreakdown[record.disease]) {
        stats.diseaseBreakdown[record.disease] = { count: 0, cost: 0, resolved: 0 };
      }
      stats.diseaseBreakdown[record.disease].count++;
      stats.diseaseBreakdown[record.disease].cost += record.cost || 0;
      if (record.isResolved) {
        stats.diseaseBreakdown[record.disease].resolved++;
      }

      // Medicine breakdown
      if (record.medicineUsed) {
        if (!stats.medicineBreakdown[record.medicineUsed]) {
          stats.medicineBreakdown[record.medicineUsed] = { count: 0, cost: 0 };
        }
        stats.medicineBreakdown[record.medicineUsed].count++;
        stats.medicineBreakdown[record.medicineUsed].cost += record.cost || 0;
      }

      // Vet breakdown
      if (!stats.vetBreakdown[record.vetName]) {
        stats.vetBreakdown[record.vetName] = { 
          count: 0, 
          cost: 0, 
          contact: record.vetContact,
          resolved: 0 
        };
      }
      stats.vetBreakdown[record.vetName].count++;
      stats.vetBreakdown[record.vetName].cost += record.cost || 0;
      if (record.isResolved) {
        stats.vetBreakdown[record.vetName].resolved++;
      }

      // Monthly breakdown
      const monthKey = new Date(record.dateOfIllness).toISOString().slice(0, 7);
      if (!stats.monthlyBreakdown[monthKey]) {
        stats.monthlyBreakdown[monthKey] = { count: 0, cost: 0, resolved: 0 };
      }
      stats.monthlyBreakdown[monthKey].count++;
      stats.monthlyBreakdown[monthKey].cost += record.cost || 0;
      if (record.isResolved) {
        stats.monthlyBreakdown[monthKey].resolved++;
      }
    });

    stats.averageCostPerCase = stats.totalRecords > 0 ? 
      Math.round((stats.totalCost / stats.totalRecords) * 100) / 100 : 0;

    stats.resolutionRate = stats.totalRecords > 0 ? 
      Math.round((stats.resolvedCases / stats.totalRecords) * 100) : 0;

    return stats;
  }

  calculateVeterinarianStats(records) {
    const vetStats = {};

    records.forEach(record => {
      if (!vetStats[record.vetName]) {
        vetStats[record.vetName] = {
          name: record.vetName,
          contact: record.vetContact,
          totalCases: 0,
          resolvedCases: 0,
          totalCost: 0,
          diseases: new Set(),
          averageCostPerCase: 0,
          resolutionRate: 0,
          lastVisit: null
        };
      }

      const vet = vetStats[record.vetName];
      vet.totalCases++;
      if (record.isResolved) vet.resolvedCases++;
      vet.totalCost += record.cost || 0;
      vet.diseases.add(record.disease);

      const recordDate = new Date(record.dateOfIllness);
      if (!vet.lastVisit || recordDate > vet.lastVisit) {
        vet.lastVisit = recordDate;
      }
    });

    // Calculate derived stats
    Object.values(vetStats).forEach(vet => {
      vet.averageCostPerCase = vet.totalCases > 0 ? 
        Math.round((vet.totalCost / vet.totalCases) * 100) / 100 : 0;
      vet.resolutionRate = vet.totalCases > 0 ? 
        Math.round((vet.resolvedCases / vet.totalCases) * 100) : 0;
      vet.diseasesHandled = Array.from(vet.diseases);
      delete vet.diseases; // Remove Set object for JSON serialization
    });

    return Object.values(vetStats);
  }
}

module.exports = new HealthController();