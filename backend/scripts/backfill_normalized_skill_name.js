require('dotenv').config();
const mongoose = require('mongoose');
const Skill = require('../models/Skill');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/placement_dashboard';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');
}

function normalize(name) {
  return (name || '').toString().trim().toLowerCase();
}

async function run() {
  await connect();

  const skills = await Skill.find({}).lean();
  const counts = {};
  skills.forEach(s => {
    const n = normalize(s.name);
    counts[n] = (counts[n] || 0) + 1;
  });

  const duplicates = Object.entries(counts).filter(([k, v]) => v > 1);
  if (duplicates.length > 0) {
    console.error('Found duplicate normalized names. Please resolve these manually before running the index creation.');
    const report = duplicates.map(([k, v]) => ({ normalizedName: k, count: v }));
    const out = {
      generatedAt: new Date().toISOString(),
      duplicates
    };
    require('fs').writeFileSync('./scripts/normalized_skill_duplicates.json', JSON.stringify(out, null, 2));
    console.error('Wrote ./scripts/normalized_skill_duplicates.json with duplicates');
    process.exit(1);
  }

  // Backfill normalizedName
  for (const skill of skills) {
    const normalized = normalize(skill.name);
    if (skill.normalizedName !== normalized) {
      await Skill.updateOne({ _id: skill._id }, { $set: { normalizedName: normalized } });
      console.log(`Updated skill ${skill._id} -> ${skill.name} (${normalized})`);
    }
  }

  // Create unique index safely if no duplicates
  try {
    await Skill.collection.createIndex({ normalizedName: 1 }, { unique: true, background: true });
    console.log('Created unique index on normalizedName');
  } catch (err) {
    console.error('Failed to create unique index:', err.message);
    process.exit(1);
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});