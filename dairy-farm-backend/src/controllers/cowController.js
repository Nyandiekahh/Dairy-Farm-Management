const firebaseService = require('../services/firebaseService');
const { HTTP_STATUS, ERROR_MESSAGES, COLLECTIONS } = require('../utils/constants');
const { sanitizeInput, generateId, calculateAge, formatDate } = require('../utils/helpers');

class CowController {
  async getAllCows(req, res, next) {
    try {
      const { page = 1, limit = 10, farm, breed, stage } = req.query;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const filters = {};
      
      // Apply farm filter based on user role
      if (userRole === 'farmer') {
        filters.farmLocation = userFarm;
      } else if (farm) {
        filters.farmLocation = farm;
      }
      
      if (breed) filters.breed = breed;
      if (stage) filters.currentStage = stage;
      
      const result = await firebaseService.getWithPagination(
        COLLECTIONS.COWS,
        filters,
        parseInt(page),
        parseInt(limit),
        'createdAt',
        'desc'
      );
      
      // Calculate age for each cow
      const cowsWithAge = result.documents.map(cow => ({
        ...cow,
        age: calculateAge(cow.dateOfBirth),
        ageInDays: Math.floor((new Date() - new Date(cow.dateOfBirth)) / (1000 * 60 * 60 * 24))
      }));
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          cows: cowsWithAge,
          pagination: result.pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCowById(req, res, next) {
    try {
      const { id } = req.params;
      const userRole = req.userRole;
      const userFarm = req.userFarm;
      
      const cow = await firebaseService.getById(COLLECTIONS.COWS, id);
      
      if (!cow) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.COW_NOT_FOUND
        });
      }

      // Check farm access for farmers
      if (userRole === 'farmer' && cow.farmLocation !== userFarm) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: ERROR_MESSAGES.FORBIDDEN
        });
      }

      // Get additional data
      const [milkRecords, feedRecords, healthRecords, calves] = await Promise.all([
        this.getCowMilkRecords(id),
        this.getCowFeedRecords(id),
        this.getCowHealthRecords(id),
        this.getCowCalves(id)
      ]);

      const cowWithDetails = {
        ...cow,
        age: calculateAge(cow.dateOfBirth),
        ageInDays: Math.floor((new Date() - new Date(cow.dateOfBirth)) / (1000 * 60 * 60 * 24)),
        totalMilkRecords: milkRecords.length,
        totalFeedRecords: feedRecords.length,
        totalHealthRecords: healthRecords.length,
        totalCalves: calves.length,
        calves: calves
      };
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          cow: cowWithDetails
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async createCow(req, res, next) {
    try {
      const {
        name,
        breed,
        dateOfBirth,
        farmLocation,
        motherId,
        fatherId,
        description,
        currentStage,
        imageUrl,
        earTagNumber,
        purchaseDate,
        purchasePrice,
        vendor
      } = req.body;
      
      const cowData = {
        name: sanitizeInput(name),
        breed: sanitizeInput(breed),
        dateOfBirth: new Date(dateOfBirth),
        farmLocation: sanitizeInput(farmLocation),
        motherId: motherId ? sanitizeInput(motherId) : null,
        fatherId: fatherId ? sanitizeInput(fatherId) : null,
        description: description ? sanitizeInput(description) : null,
        currentStage: currentStage ? sanitizeInput(currentStage) : 'active',
        imageUrl: imageUrl ? sanitizeInput(imageUrl) : null,
        earTagNumber: earTagNumber ? sanitizeInput(earTagNumber) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        vendor: vendor ? sanitizeInput(vendor) : null,
        isActive: true,
        totalMilkProduced: 0,
        averageDailyMilk: 0,
        lastMilkingDate: null,
        pregnancyStatus: {
          isPregnant: false,
          dateOfAI: null,
          expectedCalvingDate: null,
          actualCalvingDate: null
        },
        healthStatus: {
          lastCheckup: null,
          currentCondition: 'healthy',
          vaccinations: []
        }
      };

      // Verify mother exists if provided
      if (motherId) {
        const mother = await firebaseService.getById(COLLECTIONS.COWS, motherId);
        if (!mother) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'Mother cow not found'
          });
        }
      }

      const newCow = await firebaseService.create(COLLECTIONS.COWS, cowData);
      
      // If this cow has a mother, update mother's record
      if (motherId) {
        await this.updateMotherRecord(motherId, newCow.id);
      }
      
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          cow: {
            ...newCow,
            age: calculateAge(newCow.dateOfBirth),
            ageInDays: Math.floor((new Date() - new Date(newCow.dateOfBirth)) / (1000 * 60 * 60 * 24))
          }
        },
        message: 'Cow created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCow(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.createdAt;
      delete updateData.totalMilkProduced;
      delete updateData.averageDailyMilk;
      
      // Sanitize string fields
      const stringFields = ['name', 'breed', 'farmLocation', 'currentStage', 'description', 'earTagNumber', 'vendor'];
      stringFields.forEach(field => {
        if (updateData[field]) {
          updateData[field] = sanitizeInput(updateData[field]);
        }
      });

      // Convert date fields
      const dateFields = ['dateOfBirth', 'purchaseDate'];
      dateFields.forEach(field => {
        if (updateData[field]) {
          updateData[field] = new Date(updateData[field]);
        }
      });

      // Convert numeric fields
      if (updateData.purchasePrice) {
        updateData.purchasePrice = parseFloat(updateData.purchasePrice);
      }

      const updatedCow = await firebaseService.update(COLLECTIONS.COWS, id, updateData);
      
      if (!updatedCow) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.COW_NOT_FOUND
        });
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          cow: {
            ...updatedCow,
            age: calculateAge(updatedCow.dateOfBirth),
            ageInDays: Math.floor((new Date() - new Date(updatedCow.dateOfBirth)) / (1000 * 60 * 60 * 24))
          }
        },
        message: 'Cow updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCow(req, res, next) {
    try {
      const { id } = req.params;
      
      const cow = await firebaseService.getById(COLLECTIONS.COWS, id);
      if (!cow) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.COW_NOT_FOUND
        });
      }

      // Mark as inactive instead of deleting to preserve data integrity
      await firebaseService.update(COLLECTIONS.COWS, id, { 
        isActive: false,
        deletedAt: new Date()
      });
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Cow deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePregnancyStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isPregnant, dateOfAI, expectedCalvingDate, actualCalvingDate } = req.body;
      
      const pregnancyStatus = {
        isPregnant,
        dateOfAI: dateOfAI ? new Date(dateOfAI) : null,
        expectedCalvingDate: expectedCalvingDate ? new Date(expectedCalvingDate) : null,
        actualCalvingDate: actualCalvingDate ? new Date(actualCalvingDate) : null
      };

      const updatedCow = await firebaseService.update(COLLECTIONS.COWS, id, { pregnancyStatus });
      
      if (!updatedCow) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: ERROR_MESSAGES.COW_NOT_FOUND
        });
      }
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          cow: updatedCow
        },
        message: 'Pregnancy status updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getCowsByFarm(req, res, next) {
    try {
      const { farmLocation } = req.params;
      const { stage, breed } = req.query;
      
      const filters = { farmLocation, isActive: true };
      if (stage) filters.currentStage = stage;
      if (breed) filters.breed = breed;
      
      const cows = await firebaseService.getAll(COLLECTIONS.COWS, filters);
      
      const cowsWithAge = cows.map(cow => ({
        ...cow,
        age: calculateAge(cow.dateOfBirth),
        ageInDays: Math.floor((new Date() - new Date(cow.dateOfBirth)) / (1000 * 60 * 60 * 24))
      }));
      
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          cows: cowsWithAge
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  async getCowMilkRecords(cowId) {
    return await firebaseService.getAll(COLLECTIONS.MILK_RECORDS, { cowId });
  }

  async getCowFeedRecords(cowId) {
    return await firebaseService.getAll(COLLECTIONS.FEED_RECORDS, { cowId });
  }

  async getCowHealthRecords(cowId) {
    return await firebaseService.getAll(COLLECTIONS.HEALTH_RECORDS, { cowId });
  }

  async getCowCalves(cowId) {
    return await firebaseService.getAll(COLLECTIONS.COWS, { motherId: cowId });
  }

  async updateMotherRecord(motherId, calfId) {
    try {
      const mother = await firebaseService.getById(COLLECTIONS.COWS, motherId);
      if (mother) {
        const calves = mother.calves || [];
        if (!calves.includes(calfId)) {
          calves.push(calfId);
          await firebaseService.update(COLLECTIONS.COWS, motherId, { calves });
        }
      }
    } catch (error) {
      console.error('Error updating mother record:', error);
    }
  }
}

module.exports = new CowController();