const mongoose = require('mongoose');
const Job = require('./models/Job');

// Update existing draft jobs to make them visible to students
async function updateDraftJobs() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_dashboard');
    
    console.log('📊 Finding draft jobs...');
    const draftJobs = await Job.find({ status: 'draft' });
    
    if (draftJobs.length === 0) {
      console.log('✅ No draft jobs found. All jobs are already visible to students.');
      return;
    }
    
    console.log(`📝 Found ${draftJobs.length} draft jobs. Making them visible to students...`);
    
    // Update all draft jobs to application_stage
    const result = await Job.updateMany(
      { status: 'draft' },
      { 
        status: 'application_stage',
        $push: {
          statusHistory: {
            status: 'application_stage',
            changedAt: new Date(),
            notes: 'Auto-updated from draft to make visible to students'
          },
          timeline: {
            event: 'status_changed',
            description: 'Status changed from draft to application_stage (auto-update)',
            changedAt: new Date(),
            metadata: { previousStatus: 'draft', newStatus: 'application_stage', reason: 'visibility_fix' }
          }
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} jobs to 'application_stage' status`);
    console.log('📋 Jobs are now visible to students on the platform');
    
    // List the updated jobs
    const updatedJobs = await Job.find({ status: 'application_stage' })
      .select('title company.name applicationDeadline')
      .sort({ createdAt: -1 });
    
    console.log('\n📌 Jobs now visible to students:');
    updatedJobs.forEach((job, index) => {
      console.log(`  ${index + 1}. ${job.title} at ${job.company.name} (Deadline: ${job.applicationDeadline.toDateString()})`);
    });
    
  } catch (error) {
    console.error('❌ Error updating draft jobs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the update if this script is executed directly
if (require.main === module) {
  updateDraftJobs();
}

module.exports = { updateDraftJobs };