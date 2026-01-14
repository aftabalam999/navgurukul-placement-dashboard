require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const { User, Campus, Skill, Job, PlacementCycle, Application, Notification } = require('./models');
const Settings = require('./models/Settings');
const { JobReadinessConfig, StudentJobReadiness } = require('./models/JobReadiness');

const exportDatabaseConfig = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_dashboard');
    console.log('✅ Connected to MongoDB');

    const exportData = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      collections: {}
    };

    console.log('📊 Exporting collection data...');

    // Export Settings (most important for app configuration)
    const settings = await Settings.find({});
    exportData.collections.settings = settings;
    console.log(`✅ Settings: ${settings.length} documents`);

    // Export Campuses
    const campuses = await Campus.find({});
    exportData.collections.campuses = campuses;
    console.log(`✅ Campuses: ${campuses.length} documents`);

    // Export Skills
    const skills = await Skill.find({});
    exportData.collections.skills = skills;
    console.log(`✅ Skills: ${skills.length} documents`);

    // Export Users (sanitize passwords)
    const users = await User.find({});
    const sanitizedUsers = users.map(user => ({
      ...user.toObject(),
      password: '[HASHED]' // Don't export actual passwords
    }));
    exportData.collections.users = sanitizedUsers;
    console.log(`✅ Users: ${users.length} documents`);

    // Export Placement Cycles
    const cycles = await PlacementCycle.find({});
    exportData.collections.placementCycles = cycles;
    console.log(`✅ Placement Cycles: ${cycles.length} documents`);

    // Export Jobs
    const jobs = await Job.find({});
    exportData.collections.jobs = jobs;
    console.log(`✅ Jobs: ${jobs.length} documents`);

    // Export Applications
    const applications = await Application.find({});
    exportData.collections.applications = applications;
    console.log(`✅ Applications: ${applications.length} documents`);

    // Export Job Readiness Configs
    const jobReadinessConfigs = await JobReadinessConfig.find({});
    const studentJobReadiness = await StudentJobReadiness.find({});
    exportData.collections.jobReadinessConfigs = jobReadinessConfigs;
    exportData.collections.studentJobReadiness = studentJobReadiness;
    console.log(`✅ Job Readiness Configs: ${jobReadinessConfigs.length} documents`);
    console.log(`✅ Student Job Readiness: ${studentJobReadiness.length} documents`);

    // Export Notifications (recent ones only)
    const recentNotifications = await Notification.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    exportData.collections.notifications = recentNotifications;
    console.log(`✅ Recent Notifications: ${recentNotifications.length} documents`);

    // Calculate statistics
    exportData.statistics = {
      totalUsers: users.length,
      usersByRole: {
        students: users.filter(u => u.role === 'student').length,
        coordinators: users.filter(u => u.role === 'coordinator').length,
        campusPocs: users.filter(u => u.role === 'campus_poc').length,
        managers: users.filter(u => u.role === 'manager').length
      },
      totalCampuses: campuses.length,
      totalSkills: skills.length,
      totalJobs: jobs.length,
      totalApplications: applications.length,
      jobReadinessConfigs: jobReadinessConfigs.length
    };

    // Save to file
    const exportPath = path.join(__dirname, 'database-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`\n🎉 Database export completed!`);
    console.log(`📁 Export saved to: ${exportPath}`);
    console.log(`📊 Export statistics:`, exportData.statistics);

    // Create a summary file for easy reference
    const summaryPath = path.join(__dirname, 'database-summary.md');
    const summaryContent = `# Database Export Summary

**Export Date:** ${exportData.timestamp}
**Environment:** ${exportData.environment}

## Collections Overview

| Collection | Count | Description |
|------------|-------|-------------|
| Settings | ${settings.length} | App configuration and options |
| Campuses | ${campuses.length} | Campus/location data |
| Skills | ${skills.length} | Skill categories and definitions |
| Users | ${users.length} | All user accounts |
| Jobs | ${jobs.length} | Job postings |
| Applications | ${applications.length} | Student applications |
| Placement Cycles | ${cycles.length} | Placement cycles |
| Job Readiness Configs | ${jobReadinessConfigs.length} | Job readiness criteria configurations |
| Recent Notifications | ${recentNotifications.length} | Last 30 days notifications |

## User Distribution

- **Students:** ${exportData.statistics.usersByRole.students}
- **Coordinators:** ${exportData.statistics.usersByRole.coordinators}
- **Campus POCs:** ${exportData.statistics.usersByRole.campusPocs}
- **Managers:** ${exportData.statistics.usersByRole.managers}

## Important Notes

1. **Passwords:** User passwords are hashed and not exported in plain text
2. **Environment:** This export is from ${exportData.environment} environment
3. **File Location:** \`database-export.json\` contains full data
4. **Recreation:** Use \`seed.js\` and this export to recreate database

## MongoDB Connection Setup

To connect to deployed MongoDB, update \`.env\`:

\`\`\`
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
JWT_SECRET=<secure-jwt-secret>
NODE_ENV=production
\`\`\`

## Next Steps

1. Set up MongoDB Atlas or deployed MongoDB instance
2. Update \`.env\` with connection string
3. Run \`node seed.js\` to populate initial data
4. Import additional data from \`database-export.json\` if needed
`;

    fs.writeFileSync(summaryPath, summaryContent);
    console.log(`📝 Summary saved to: ${summaryPath}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
};

// Run export
exportDatabaseConfig();