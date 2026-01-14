require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Skill = require('../models/Skill');
const fs = require('fs');

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/placement_dashboard';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

function normalize(name) {
  return (name || '').toString().trim().toLowerCase();
}

async function run() {
  await connect();

  // Load skills
  const skills = await Skill.find({}).select('name').lean();
  const skillMap = new Map();
  skills.forEach(s => skillMap.set(normalize(s.name), s.name));

  const cursor = User.find({ 'studentProfile.technicalSkills.0': { $exists: true } }).cursor();

  const mismatches = new Map(); // key: normalized name or skillId|mismatch

  for (let user = await cursor.next(); user != null; user = await cursor.next()) {
    const email = user.email;
    const uid = user._id.toString();
    const studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const tech = user.studentProfile?.technicalSkills || [];

    for (const entry of tech) {
      const rawName = entry.skillName || '';
      const norm = normalize(rawName);

      // If there is a skillId, verify its canonical name
      if (entry.skillId) {
        const skill = skills.find(s => s._id && s._id.toString() === entry.skillId.toString());
        const skillNameNorm = skill ? normalize(skill.name) : null;
        if (!skill) {
          // skillId references missing skill document
          const key = `missing_skilldoc:${entry.skillId}`;
          const item = mismatches.get(key) || { label: `<missing_skill:${entry.skillId}>`, count: 0, examples: [] };
          item.count += 1;
          if (item.examples.length < 5) item.examples.push({ uid, email, studentName, skillName: rawName });
          mismatches.set(key, item);
          continue;
        }

        if (skillNameNorm !== norm) {
          const key = `name_mismatch_for_id:${entry.skillId}`;
          const item = mismatches.get(key) || { label: `SkillId ${entry.skillId} name mismatch (db: ${skill.name})`, count: 0, examples: [] };
          item.count += 1;
          if (item.examples.length < 5) item.examples.push({ uid, email, studentName, profileSkillName: rawName, canonicalSkillName: skill.name });
          mismatches.set(key, item);
        }

        continue; // name differences with skillId handled, no need to check against list
      }

      // No skillId -- check exact case-insensitive match
      if (!skillMap.has(norm)) {
        const key = `unknown_name:${norm}`;
        const item = mismatches.get(key) || { label: rawName, normalized: norm, count: 0, examples: [] };
        item.count += 1;
        if (item.examples.length < 5) item.examples.push({ uid, email, studentName, skillName: rawName });
        mismatches.set(key, item);
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    skillsCount: skills.length,
    mismatches: Array.from(mismatches.values()).map(v => ({ ...v }))
  };

  const outPath = './scripts/skill_mismatch_report.json';
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Report written to ${outPath}`);
  console.log(JSON.stringify(report, null, 2));

  await mongoose.disconnect();
  console.log('Disconnected');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
