// Create this file as: src/scripts/setup-firestore.js
require('dotenv').config();
const { db, auth } = require('../config/firebase');
const { COLLECTIONS, FARM_LOCATIONS, USER_ROLES } = require('../utils/constants');

async function setupFirestore() {
  try {
    console.log('🚀 Setting up Firestore for Dairy Farm Management...\n');
    
    // 1. Create sample farms
    console.log('📍 Creating farm locations...');
    const farms = [
      {
        id: 'nakuru-farm',
        name: 'Nakuru Dairy Farm',
        location: FARM_LOCATIONS.NAKURU,
        address: 'Nakuru County, Kenya',
        contactPhone: '+254712345678',
        contactEmail: 'nakuru@dairyfarm.com',
        manager: 'John Kamau',
        description: 'Main dairy farm in Nakuru',
        establishedDate: new Date('2020-01-15'),
        size: 50.5, // hectares
        specialization: ['dairy', 'cattle'],
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
      },
      {
        id: 'kisii-farm',
        name: 'Kisii Highland Farm',
        location: FARM_LOCATIONS.KISII,
        address: 'Kisii County, Kenya',
        contactPhone: '+254798765432',
        contactEmail: 'kisii@dairyfarm.com',
        manager: 'Mary Nyambura',
        description: 'Highland farm specializing in dairy and poultry',
        establishedDate: new Date('2019-06-01'),
        size: 30.2,
        specialization: ['dairy', 'poultry'],
        isActive: true,
        settings: {
          milkingSessions: ['morning', 'evening'],
          milkingTimes: {
            morning: '06:30',
            evening: '18:30'
          },
          defaultCurrency: 'KES',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        }
      }
    ];

    for (const farm of farms) {
      await db.collection(COLLECTIONS.FARMS).doc(farm.id).set(farm);
      console.log(`✅ Created farm: ${farm.name}`);
    }

    // 2. Create sample admin user
    console.log('\n👤 Creating sample admin user...');
    const adminUser = {
      id: 'admin-user-1',
      email: 'admin@dairyfarm.com',
      firstName: 'Farm',
      lastName: 'Administrator', 
      role: USER_ROLES.ADMIN,
      assignedFarm: null, // Admin can access all farms
      phone: '+254700000000',
      isActive: true,
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
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(COLLECTIONS.USERS).doc(adminUser.id).set(adminUser);
    console.log(`✅ Created admin user: ${adminUser.email}`);

    // 3. Create sample farmer user
    const farmerUser = {
      id: 'farmer-user-1',
      email: 'farmer@dairyfarm.com',
      firstName: 'Farm',
      lastName: 'Worker',
      role: USER_ROLES.FARMER,
      assignedFarm: FARM_LOCATIONS.NAKURU,
      phone: '+254711111111',
      isActive: true,
      permissions: {
        canViewCows: true,
        canAddCows: false,
        canEditCows: false,
        canDeleteCows: false,
        canViewMilkRecords: true,
        canAddMilkRecords: true,
        canEditMilkRecords: false,
        canViewFeedRecords: true,
        canAddFeedRecords: true,
        canEditFeedRecords: false,
        canViewHealthRecords: false,
        canAddHealthRecords: false,
        canEditHealthRecords: false,
        canViewChicken: true,
        canAddChicken: false,
        canEditChicken: false,
        canDeleteChicken: false,
        canViewStats: true,
        canManageUsers: false,
        canManageSystem: false,
        canViewSalesData: false,
        canEditSalesData: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(COLLECTIONS.USERS).doc(farmerUser.id).set(farmerUser);
    console.log(`✅ Created farmer user: ${farmerUser.email}`);

    // 4. Create sample cow
    console.log('\n🐄 Creating sample cattle...');
    const sampleCow = {
      id: 'cow-001',
      name: 'Bella',
      breed: 'Holstein Friesian',
      dateOfBirth: new Date('2021-03-15'),
      farmLocation: FARM_LOCATIONS.NAKURU,
      motherId: null,
      fatherId: null,
      description: 'High-producing dairy cow',
      currentStage: 'lactating',
      imageUrl: null,
      earTagNumber: 'NK001',
      purchaseDate: new Date('2021-03-15'),
      purchasePrice: 45000,
      vendor: 'Nakuru Livestock Market',
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
        lastCheckup: new Date(),
        currentCondition: 'healthy',
        vaccinations: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(COLLECTIONS.COWS).doc(sampleCow.id).set(sampleCow);
    console.log(`✅ Created cow: ${sampleCow.name} (${sampleCow.earTagNumber})`);

    // 5. Create sample chicken batch
    console.log('\n🐔 Creating sample chicken batch...');
    const sampleChickenBatch = {
      id: 'batch-001',
      batchId: 'CHICK_2024_001',
      initialCount: 100,
      currentCount: 98,
      dateAcquired: new Date('2024-01-15'),
      farmLocation: FARM_LOCATIONS.KISII,
      breed: 'Kienyeji',
      cost: 25000,
      supplier: 'Kisii Poultry Farm',
      description: 'Local breed chickens for egg production',
      expectedEggProductionAge: 150,
      expectedLifespan: 365,
      isActive: true,
      totalEggsProduced: 0,
      totalDeaths: 2,
      totalHatched: 0,
      feedConsumption: {
        totalQuantity: 0,
        averagePerDay: 0
      },
      productionStats: {
        startedLayingDate: null,
        peakProductionDate: null,
        averageEggsPerDay: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection(COLLECTIONS.CHICKEN_BATCHES).doc(sampleChickenBatch.id).set(sampleChickenBatch);
    console.log(`✅ Created chicken batch: ${sampleChickenBatch.batchId}`);

    // 6. Create system settings
    console.log('\n⚙️ Creating system settings...');
    const systemSettings = {
      appName: 'Dairy Farm Management System',
      version: '1.0.0',
      initialized: true,
      initializedAt: new Date(),
      defaultSettings: {
        milkingSessions: ['morning', 'afternoon', 'evening'],
        currencies: ['KES', 'USD'],
        defaultCurrency: 'KES',
        feedTypes: {
          concentrates: ['dairy_meal', 'maize_jam'],
          minerals: ['maclic_supa', 'maclic_plus'],
          roughage: ['napier', 'hay', 'silage']
        },
        chickenSettings: {
          defaultLifespan: 365,
          eggProductionAge: 150,
          defaultBatchSize: 100
        }
      },
      notifications: {
        lowMilkProduction: true,
        healthIssues: true,
        feedRestock: true,
        chickenAging: true
      }
    };

    await db.collection(COLLECTIONS.SYSTEM_SETTINGS).doc('app-config').set(systemSettings);
    console.log('✅ Created system settings');

    // 7. Initialize empty collections (creates them in Firestore)
    console.log('\n📊 Initializing remaining collections...');
    const emptyCollections = [
      COLLECTIONS.MILK_RECORDS,
      COLLECTIONS.FEED_RECORDS,
      COLLECTIONS.HEALTH_RECORDS,
      COLLECTIONS.EGG_RECORDS,
      COLLECTIONS.FEED_INVENTORY
    ];

    for (const collection of emptyCollections) {
      // Create and immediately delete a placeholder to initialize collection
      const placeholder = await db.collection(collection).add({ _placeholder: true });
      await db.collection(collection).doc(placeholder.id).delete();
      console.log(`✅ Initialized collection: ${collection}`);
    }

    console.log('\n🎉 Firestore setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   ✅ 2 Farm locations (Nakuru & Kisii)');
    console.log('   ✅ 2 Users (Admin & Farmer)');
    console.log('   ✅ 1 Sample cow (Bella)');
    console.log('   ✅ 1 Sample chicken batch');
    console.log('   ✅ System settings');
    console.log('   ✅ All required collections');
    
    console.log('\n🚀 Your backend is ready to use!');
    console.log('\n📝 Test credentials:');
    console.log('   Admin: admin@dairyfarm.com');
    console.log('   Farmer: farmer@dairyfarm.com');
    console.log('   (You\'ll need to create these users in Firebase Auth)');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupFirestore();