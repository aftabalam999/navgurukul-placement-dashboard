const fs = require('fs');
const mongoose = require('mongoose');

// Import all models
const User = require('./models/User');
const Campus = require('./models/Campus');
const Job = require('./models/Job');
const Skill = require('./models/Skill');
const Application = require('./models/Application');
const Notification = require('./models/Notification');
const JobReadinessConfig = require('./models/JobReadiness').JobReadinessConfig;
const StudentJobReadiness = require('./models/JobReadiness').StudentJobReadiness;

// MongoDB Atlas connection (you'll need to replace with your actual connection string)
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/placement_dashboard?retryWrites=true&w=majority';

async function migrateDatabase() {
  try {
    console.log('🚀 Starting database migration to MongoDB Atlas...');
    
    // Load exported data
    if (!fs.existsSync('./database-export.json')) {
      console.error('❌ database-export.json not found. Please run export-database-config.js first.');
      process.exit(1);
    }

    const exportedData = JSON.parse(fs.readFileSync('./database-export.json', 'utf8'));
    
    // Connect to MongoDB Atlas
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data (be careful!)
    console.log('🧹 Clearing existing collections...');
    const collections = ['users', 'campuses', 'jobs', 'skills', 'applications', 'notifications', 'jobreadinessconfigs', 'studentjobreadiness'];
    
    for (const collectionName of collections) {
      try {
        await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`  ✅ Cleared ${collectionName} collection`);
      } catch (error) {
        console.log(`  ⚠️  Collection ${collectionName} doesn't exist or already empty`);
      }
    }

    // Import data in correct order (considering dependencies)
    
    // 1. Import Campuses first (referenced by Users)
    if (exportedData.campuses && exportedData.campuses.length > 0) {
      console.log('📍 Importing campuses...');
      await Campus.insertMany(exportedData.campuses);
      console.log(`  ✅ Imported ${exportedData.campuses.length} campuses`);
    }

    // 2. Import Users
    if (exportedData.users && exportedData.users.length > 0) {
      console.log('👥 Importing users...');
      await User.insertMany(exportedData.users);
      console.log(`  ✅ Imported ${exportedData.users.length} users`);
    }

    // 3. Import Skills
    if (exportedData.skills && exportedData.skills.length > 0) {
      console.log('🎯 Importing skills...');
      await Skill.insertMany(exportedData.skills);
      console.log(`  ✅ Imported ${exportedData.skills.length} skills`);
    }

    // 4. Import Jobs
    if (exportedData.jobs && exportedData.jobs.length > 0) {
      console.log('💼 Importing jobs...');
      await Job.insertMany(exportedData.jobs);
      console.log(`  ✅ Imported ${exportedData.jobs.length} jobs`);
    }

    // 5. Import Applications
    if (exportedData.applications && exportedData.applications.length > 0) {
      console.log('📄 Importing applications...');
      await Application.insertMany(exportedData.applications);
      console.log(`  ✅ Imported ${exportedData.applications.length} applications`);
    }

    // 6. Import Job Readiness Configs
    if (exportedData.jobreadinessconfigs && exportedData.jobreadinessconfigs.length > 0) {
      console.log('📋 Importing job readiness configs...');
      await JobReadinessConfig.insertMany(exportedData.jobreadinessconfigs);
      console.log(`  ✅ Imported ${exportedData.jobreadinessconfigs.length} job readiness configs`);
    }

    // 7. Import Student Job Readiness (if any)
    if (exportedData.studentjobreadiness && exportedData.studentjobreadiness.length > 0) {
      console.log('📊 Importing student job readiness data...');
      await StudentJobReadiness.insertMany(exportedData.studentjobreadiness);
      console.log(`  ✅ Imported ${exportedData.studentjobreadiness.length} student job readiness records`);
    }

    // 8. Import Notifications
    if (exportedData.notifications && exportedData.notifications.length > 0) {
      console.log('🔔 Importing notifications...');
      await Notification.insertMany(exportedData.notifications);
      console.log(`  ✅ Imported ${exportedData.notifications.length} notifications`);
    }

    console.log('\n🎉 Database migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`  - Users: ${exportedData.users?.length || 0}`);
    console.log(`  - Campuses: ${exportedData.campuses?.length || 0}`);
    console.log(`  - Skills: ${exportedData.skills?.length || 0}`);
    console.log(`  - Jobs: ${exportedData.jobs?.length || 0}`);
    console.log(`  - Applications: ${exportedData.applications?.length || 0}`);
    console.log(`  - Job Readiness Configs: ${exportedData.jobreadinessconfigs?.length || 0}`);
    console.log(`  - Student Job Readiness: ${exportedData.studentjobreadiness?.length || 0}`);
    console.log(`  - Notifications: ${exportedData.notifications?.length || 0}`);
    
    console.log('\n🔗 MongoDB Atlas connection string used:');
    console.log(ATLAS_URI.replace(/:([^:@]{8})[^:@]*@/, ':****@')); // Hide password
    
    console.log('\n✨ Your application is now ready to use with MongoDB Atlas!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

// Check if this script is run directly
if (require.main === module) {
  migrateDatabase();
}

module.exports = { migrateDatabase };