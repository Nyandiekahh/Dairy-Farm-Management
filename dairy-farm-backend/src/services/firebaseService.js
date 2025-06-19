const { db, auth, admin } = require('../config/firebase');
const { COLLECTIONS } = require('../utils/constants');

class FirebaseService {
  // Generic CRUD operations
  async create(collection, data, customId = null) {
    try {
      const docRef = customId 
        ? db.collection(collection).doc(customId)
        : db.collection(collection).doc();
        
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const docData = {
        ...data,
        id: docRef.id,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await docRef.set(docData);
      return { id: docRef.id, ...docData };
    } catch (error) {
      console.error(`Error creating document in ${collection}:`, error);
      throw error;
    }
  }

  async getById(collection, id) {
    try {
      const doc = await db.collection(collection).doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting document from ${collection}:`, error);
      throw error;
    }
  }

  async update(collection, id, data) {
    try {
      const updateData = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection(collection).doc(id).update(updateData);
      return await this.getById(collection, id);
    } catch (error) {
      console.error(`Error updating document in ${collection}:`, error);
      throw error;
    }
  }

  async delete(collection, id) {
    try {
      await db.collection(collection).doc(id).delete();
      return true;
    } catch (error) {
      console.error(`Error deleting document from ${collection}:`, error);
      throw error;
    }
  }

  async getAll(collection, filters = {}) {
    try {
      let query = db.collection(collection);
      
      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          query = query.where(field, '==', value);
        }
      });
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting documents from ${collection}:`, error);
      throw error;
    }
  }

  async getWithPagination(collection, filters = {}, page = 1, limit = 10, orderBy = 'createdAt', orderDirection = 'desc') {
    try {
      let query = db.collection(collection);
      
      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          query = query.where(field, '==', value);
        }
      });
      
      // Apply ordering
      query = query.orderBy(orderBy, orderDirection);
      
      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);
      
      const snapshot = await query.get();
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get total count
      const totalQuery = db.collection(collection);
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          totalQuery.where(field, '==', value);
        }
      });
      const totalSnapshot = await totalQuery.get();
      const totalCount = totalSnapshot.size;
      
      return {
        documents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          hasNext: (page * limit) < totalCount,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error(`Error getting paginated documents from ${collection}:`, error);
      throw error;
    }
  }

  async query(collection, conditions = []) {
    try {
      let query = db.collection(collection);
      
      conditions.forEach(condition => {
        const [field, operator, value] = condition;
        query = query.where(field, operator, value);
      });
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error querying documents from ${collection}:`, error);
      throw error;
    }
  }

  async queryWithDateRange(collection, dateField, startDate, endDate, additionalFilters = {}) {
    try {
      let query = db.collection(collection);
      
      // Apply date range
      if (startDate) {
        query = query.where(dateField, '>=', new Date(startDate));
      }
      if (endDate) {
        query = query.where(dateField, '<=', new Date(endDate));
      }
      
      // Apply additional filters
      Object.entries(additionalFilters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          query = query.where(field, '==', value);
        }
      });
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error querying documents with date range from ${collection}:`, error);
      throw error;
    }
  }

  async batchWrite(operations) {
    try {
      const batch = db.batch();
      
      operations.forEach(operation => {
        const { type, collection, id, data } = operation;
        const docRef = db.collection(collection).doc(id);
        
        switch (type) {
          case 'set':
            batch.set(docRef, {
              ...data,
              id: id,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...data,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error executing batch write:', error);
      throw error;
    }
  }

  // User-specific operations
  async createUser(userData) {
    try {
      const { email, password, ...otherData } = userData;
      
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: false
      });
      
      // Create user document in Firestore
      const userDoc = await this.create(COLLECTIONS.USERS, {
        email,
        ...otherData,
        uid: userRecord.uid
      }, userRecord.uid);
      
      return userDoc;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const snapshot = await db.collection(COLLECTIONS.USERS)
        .where('email', '==', email)
        .limit(1)
        .get();
        
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async updateUserRole(userId, role, assignedFarm = null) {
    try {
      const updateData = { role };
      if (assignedFarm) {
        updateData.assignedFarm = assignedFarm;
      }
      
      return await this.update(COLLECTIONS.USERS, userId, updateData);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseService();