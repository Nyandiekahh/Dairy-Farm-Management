require('dotenv').config();
const { auth, db } = require('./src/config/firebase');

async function createInitialAdmin() {
  try {
    console.log('Creating initial admin user...');

    const adminEmail = 'admin@dairyfarm.com';
    const adminPassword = 'admin123'; // Change this to a secure password

    // Check if admin already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
      console.log('Admin user exists in Firebase Auth');
      
      // Check if Firestore document exists
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      if (userDoc.exists) {
        console.log('✅ Admin setup complete. You can now login.');
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        process.exit(0);
      } else {
        console.log('Creating missing Firestore document...');
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create admin in Firebase Auth
        console.log('Creating admin in Firebase Auth...');
        userRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          emailVerified: true
        });
        console.log('Admin created in Firebase Auth');
      } else {
        throw error;
      }
    }

    // Create admin document in Firestore
    const adminData = {
      email: adminEmail,
      firstName: 'System',
      lastName: 'Admin',
      role: 'admin',
      assignedFarm: null,
      isActive: true,
      uid: userRecord.uid,
      id: userRecord.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: {
        canViewCows: true,
        canAddCows: true,
        canEditCows: true,
        canDeleteCows: true,
        canViewMilkRecords: true,
        canAddMilkRecords: true,
        canEditMilkRecords: true,
        canViewFeedRecords: true,
        canAddFeedRecords: true,
        canEditFeedRecords: true,
        canViewHealthRecords: true,
        canAddHealthRecords: true,
        canEditHealthRecords: true,
        canViewChicken: true,
        canAddChicken: true,
        canEditChicken: true,
        canDeleteChicken: true,
        canViewStats: true,
        canManageUsers: true,
        canManageSystem: true,
        canViewSalesData: true,
        canEditSalesData: true
      }
    };

    await db.collection('users').doc(userRecord.uid).set(adminData);

    console.log('✅ Initial admin created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('🎯 You can now login and create other users through the frontend.');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating initial admin:', error);
    process.exit(1);
  }
}

createInitialAdmin();