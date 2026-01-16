const mongoose = require('mongoose');
const Skill = require('../models/Skill');
require('dotenv').config();

const DEFAULT_SOFT_SKILLS = [
    { name: 'Communication', category: 'soft_skill', isCommon: true, description: 'Verbal and written communication' },
    { name: 'Collaboration', category: 'soft_skill', isCommon: true, description: 'Working effectively with others' },
    { name: 'Creativity', category: 'soft_skill', isCommon: true, description: 'Innovative thinking and problem-solving' },
    { name: 'Critical Thinking', category: 'soft_skill', isCommon: true, description: 'Analytical and logical reasoning' },
    { name: 'Problem Solving', category: 'soft_skill', isCommon: true, description: 'Finding solutions to challenges' },
    { name: 'Adaptability', category: 'soft_skill', isCommon: true, description: 'Flexibility in changing situations' },
    { name: 'Time Management', category: 'soft_skill', isCommon: true, description: 'Organizing and prioritizing tasks' },
    { name: 'Leadership', category: 'soft_skill', isCommon: true, description: 'Guiding and motivating others' },
    { name: 'Teamwork', category: 'soft_skill', isCommon: true, description: 'Contributing to team success' },
    { name: 'Emotional Intelligence', category: 'soft_skill', isCommon: true, description: 'Understanding and managing emotions' }
];

async function createDefaultSoftSkills() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const skill of DEFAULT_SOFT_SKILLS) {
            const existing = await Skill.findOne({ name: skill.name });
            if (existing) {
                console.log(`✓ Skill "${skill.name}" already exists`);
            } else {
                await Skill.create(skill);
                console.log(`✓ Created skill: ${skill.name}`);
            }
        }

        console.log('\n✅ Default soft skills setup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating default soft skills:', error);
        process.exit(1);
    }
}

createDefaultSoftSkills();
