require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Skill = require('../models/Skill');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/placement_dashboard';
  await mongoose.connect(uri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });
  console.log('Connected to MongoDB');
}

async function migrateSkillIds({ dryRun = false } = {}) {
  const users = await User.find({ 'studentProfile.technicalSkills.0': { $exists: true } }).lean();
  let updatedUsers = 0;
  let updatedEntries = 0;

  for (const user of users) {
    const techSkills = user.studentProfile?.technicalSkills || [];
    const updates = [];

    for (const entry of techSkills) {
      if (!entry.skillId && entry.skillName) {
        const skill = await Skill.findOne({ name: { $regex: new RegExp(`^${entry.skillName}$`, 'i') } }).lean();
        if (skill) {
          updates.push({ old: entry.skillId, new: skill._id, name: entry.skillName });
        }
      }
    }

    if (updates.length > 0) {
      updatedUsers++;
      updatedEntries += updates.length;
      console.log(`User ${user._id} (${user.email}) will update ${updates.length} entries`);
      updates.forEach(u => console.log(`  - ${u.name} -> ${u.new}`));

      if (!dryRun) {
        await User.updateOne(
          { _id: user._id },
          {
            $set: Object.fromEntries(
              techSkills.map((entry, idx) => {
                const found = updates.find(u => u.name === entry.skillName && !entry.skillId);
                return [
                  `studentProfile.technicalSkills.${idx}.skillId`,
                  found ? found.new : entry.skillId || null
                ];
              })
            )
          }
        );
      }
    }
  }

  console.log(`\nSummary: users affected=${updatedUsers}, entries updated=${updatedEntries}${dryRun ? ' (dry-run)' : ''}`);
}

(async () => {
  try {
    await connect();
    const dryRun = process.argv.includes('--dry-run');
    await migrateSkillIds({ dryRun });
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
})();
