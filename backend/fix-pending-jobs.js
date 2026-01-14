const mongoose = require('mongoose');
const Job = require('./models/Job');

async function fixPendingApprovalJobs() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_dashboard');
    
    console.log('📊 Finding jobs with pending_approval status...');
    const pendingJobs = await Job.find({ status: 'pending_approval' });
    
    if (pendingJobs.length === 0) {
      console.log('✅ No pending approval jobs found.');
      return;
    }
    
    console.log(`📝 Found ${pendingJobs.length} jobs with pending_approval status:`);
    pendingJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} at ${job.company.name}`);
    });
    
    console.log('\\n🔄 Updating them to application_stage to make visible to students...');
    
    // Update all pending_approval jobs to application_stage
    const result = await Job.updateMany(
      { status: 'pending_approval' },
      { 
        status: 'application_stage',
        $push: {
          statusHistory: {
            status: 'application_stage',
            changedAt: new Date(),
            notes: 'Auto-updated from pending_approval to make visible to students'
          },
          timeline: {
            event: 'status_changed',
            description: 'Status changed from pending_approval to application_stage (visibility fix)',
            changedAt: new Date(),
            metadata: { 
              previousStatus: 'pending_approval', 
              newStatus: 'application_stage', 
              reason: 'student_visibility_fix' 
            }
          }
        }
      }
    );
    
    console.log(`✅ Successfully updated ${result.modifiedCount} jobs to application_stage status`);
    console.log('👁️  These jobs are now visible to students on the platform!');
    
    // Verify the update
    console.log('\\n📊 Verifying update...');
    const updatedJobs = await Job.find({ status: 'application_stage' })
      .select('title company.name applicationDeadline')
      .sort({ createdAt: -1 });
    
    console.log(`\\n✅ ${updatedJobs.length} jobs are now in application_stage (visible to students):`);
    updatedJobs.forEach((job, index) => {
      const deadline = new Date(job.applicationDeadline);
      const isOpen = deadline > new Date();
      const status = isOpen ? `Open until ${deadline.toDateString()}` : `Closed since ${deadline.toDateString()}`;
      console.log(`   ${index + 1}. ${job.title} at ${job.company.name} - ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating pending approval jobs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\\n🔌 Disconnected from database');
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixPendingApprovalJobs();
}

module.exports = { fixPendingApprovalJobs };