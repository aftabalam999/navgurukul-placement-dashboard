const mongoose = require('mongoose');

// Single document schema that holds all configurable settings
const settingsSchema = new mongoose.Schema({
  // Map of school name to array of modules
  schoolModules: {
    type: Map,
    of: [String],
    default: new Map()
  },
  // Available placement role preferences
  rolePreferences: {
    type: [String],
    default: []
  },
  // Technical skills for self-assessment
  technicalSkills: {
    type: [String],
    default: []
  },
  // Degree options
  degreeOptions: {
    type: [String],
    default: []
  },
  // Soft skills options
  softSkills: {
    type: [String],
    default: []
  },
  // Course skills (user-added skills from courses - available to all)
  courseSkills: {
    type: [String],
    default: []
  },
  // Course providers
  courseProviders: {
    type: [String],
    default: ['Navgurukul', 'Coursera', 'Udemy', 'LinkedIn Learning', 'YouTube', 'Other']
  },
  // Last updated by
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      schoolModules: new Map([
        ['School Of Programming', []],
        ['School Of Business', []],
        ['School of Second Chance', []],
        ['School of Finance', []],
        ['School of Education', []]
      ]),
      rolePreferences: [],
      technicalSkills: [],
      degreeOptions: [],
      softSkills: []
    });
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function(updates, userId) {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
  }
  
  if (updates.schoolModules) {
    // Convert object to Map if needed
    if (!(updates.schoolModules instanceof Map)) {
      settings.schoolModules = new Map(Object.entries(updates.schoolModules));
    } else {
      settings.schoolModules = updates.schoolModules;
    }
  }
  if (updates.rolePreferences) settings.rolePreferences = updates.rolePreferences;
  if (updates.technicalSkills) settings.technicalSkills = updates.technicalSkills;
  if (updates.degreeOptions) settings.degreeOptions = updates.degreeOptions;
  if (updates.softSkills) settings.softSkills = updates.softSkills;
  if (userId) settings.lastUpdatedBy = userId;
  
  await settings.save();
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
