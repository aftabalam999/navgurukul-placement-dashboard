const mongoose = require('mongoose');
const User = require('../models/User');
const Skill = require('../models/Skill');
require('dotenv').config();

const SKILL_MAPPING = {
    communication: 'Communication',
    collaboration: 'Collaboration',
    creativity: 'Creativity',
    criticalThinking: 'Critical Thinking',
    problemSolving: 'Problem Solving',
    adaptability: 'Adaptability',
    timeManagement: 'Time Management',
    leadership: 'Leadership',
    teamwork: 'Teamwork',
    emotionalIntelligence: 'Emotional Intelligence'
};

async function migrateSoftSkills() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get all soft skills from Skill collection
        const softSkills = await Skill.find({ category: 'soft_skill' });
        const skillMap = {};
        softSkills.forEach(s => {
            skillMap[s.name] = s._id;
        });

        console.log(`Found ${softSkills.length} soft skills in Skill collection`);

        // Get all students with old soft skills format (object type)
        const students = await User.find({
            role: 'student',
            'studentProfile.softSkills': { $exists: true, $type: 'object' }
        });

        console.log(`Found ${students.length} students to migrate`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const student of students) {
            const oldSoftSkills = student.studentProfile.softSkills;
            const newSoftSkills = [];

            // Convert old format to new format
            for (const [key, rating] of Object.entries(oldSoftSkills)) {
                if (rating > 0) {
                    const skillName = SKILL_MAPPING[key];
                    const skillId = skillMap[skillName];

                    if (skillId) {
                        newSoftSkills.push({
                            skillId,
                            skillName,
                            selfRating: rating,
                            addedAt: new Date()
                        });
                    } else {
                        console.warn(`⚠️  Skill "${skillName}" not found in Skill collection`);
                    }
                }
            }

            if (newSoftSkills.length > 0) {
                student.studentProfile.softSkills = newSoftSkills;
                await student.save();
                migratedCount++;
                console.log(`✓ Migrated ${student.firstName} ${student.lastName} (${newSoftSkills.length} skills)`);
            } else {
                skippedCount++;
            }
        }

        console.log('\n✅ Migration complete!');
        console.log(`   Migrated: ${migratedCount} students`);
        console.log(`   Skipped: ${skippedCount} students (no soft skills rated)`);

        process.exit(0);
    } catch (error) {
        console.error('Error migrating soft skills:', error);
        process.exit(1);
    }
}

migrateSoftSkills();
