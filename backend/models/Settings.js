const mongoose = require('mongoose');

// Pipeline stage schema for job workflow
const pipelineStageSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Unique identifier (slug)
  label: { type: String, required: true }, // Display name
  description: { type: String, default: '' },
  color: { type: String, default: 'gray' }, // Color theme: gray, yellow, green, orange, blue, red, purple, pink, indigo
  order: { type: Number, required: true }, // Position in pipeline
  isDefault: { type: Boolean, default: false }, // System default stages can't be deleted
  visibleToStudents: { type: Boolean, default: true }, // Whether students can see jobs in this stage
  studentLabel: { type: String, default: '' } // Friendly label for students (optional)
}, { _id: false });

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
  // Job pipeline stages (customizable workflow)
  jobPipelineStages: {
    type: [pipelineStageSchema],
    default: []
  },
  // AI Integration Settings
  aiConfig: {
    googleApiKey: { type: String, default: '' }, // Google AI Studio API key
    enabled: { type: Boolean, default: true }
  },
  // Last updated by
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Default pipeline stages
const DEFAULT_PIPELINE_STAGES = [
  { id: 'draft', label: 'Draft', description: 'Jobs being prepared', color: 'gray', order: 0, isDefault: true, visibleToStudents: false, studentLabel: '' },
  { id: 'pending_approval', label: 'Pending Approval', description: 'Awaiting manager approval', color: 'yellow', order: 1, isDefault: true, visibleToStudents: false, studentLabel: '' },
  { id: 'application_stage', label: 'Application Stage', description: 'Open for applications', color: 'green', order: 2, isDefault: true, visibleToStudents: true, studentLabel: 'Now Hiring' },
  { id: 'hr_shortlisting', label: 'HR Shortlisting', description: 'Reviewing applications', color: 'indigo', order: 3, isDefault: true, visibleToStudents: true, studentLabel: 'Shortlisting' },
  { id: 'interviewing', label: 'Interviewing', description: 'Interview process ongoing', color: 'blue', order: 4, isDefault: true, visibleToStudents: true, studentLabel: 'Interviews Ongoing' },
  { id: 'on_hold', label: 'On Hold', description: 'Temporarily paused', color: 'orange', order: 5, isDefault: false, visibleToStudents: true, studentLabel: 'Applications Paused' },
  { id: 'closed', label: 'Closed', description: 'No longer accepting applications', color: 'red', order: 6, isDefault: true, visibleToStudents: true, studentLabel: 'Closed' },
  { id: 'filled', label: 'Filled', description: 'Position(s) filled', color: 'purple', order: 7, isDefault: true, visibleToStudents: true, studentLabel: 'Position Filled' }
];

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
      softSkills: [],
      jobPipelineStages: DEFAULT_PIPELINE_STAGES
    });
  }
  
  // Ensure pipeline stages exist (for existing databases)
  if (!settings.jobPipelineStages || settings.jobPipelineStages.length === 0) {
    settings.jobPipelineStages = DEFAULT_PIPELINE_STAGES;
    await settings.save();
  }
  
  return settings;
};

// Get valid status IDs for validation
settingsSchema.statics.getValidStatuses = async function() {
  const settings = await this.getSettings();
  return settings.jobPipelineStages.map(stage => stage.id);
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
  if (updates.jobPipelineStages) settings.jobPipelineStages = updates.jobPipelineStages;
  if (userId) settings.lastUpdatedBy = userId;
  
  await settings.save();
  return settings;
};

// Add a new pipeline stage
settingsSchema.statics.addPipelineStage = async function(stage, userId) {
  const settings = await this.getSettings();
  
  // Generate ID from label if not provided
  if (!stage.id) {
    stage.id = stage.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }
  
  // Check for duplicate ID
  if (settings.jobPipelineStages.some(s => s.id === stage.id)) {
    throw new Error('Stage with this ID already exists');
  }
  
  // Set order to end if not specified
  if (stage.order === undefined) {
    stage.order = settings.jobPipelineStages.length;
  }
  
  settings.jobPipelineStages.push(stage);
  settings.jobPipelineStages.sort((a, b) => a.order - b.order);
  settings.lastUpdatedBy = userId;
  await settings.save();
  return settings;
};

// Update a pipeline stage
settingsSchema.statics.updatePipelineStage = async function(stageId, updates, userId) {
  const settings = await this.getSettings();
  const stageIndex = settings.jobPipelineStages.findIndex(s => s.id === stageId);
  
  if (stageIndex === -1) {
    throw new Error('Stage not found');
  }
  
  const stage = settings.jobPipelineStages[stageIndex];
  
  // Prevent changing ID of default stages
  if (stage.isDefault && updates.id && updates.id !== stage.id) {
    throw new Error('Cannot change ID of default stages');
  }
  
  // Update allowed fields
  if (updates.label) stage.label = updates.label;
  if (updates.description !== undefined) stage.description = updates.description;
  if (updates.color) stage.color = updates.color;
  if (updates.visibleToStudents !== undefined) stage.visibleToStudents = updates.visibleToStudents;
  if (updates.studentLabel !== undefined) stage.studentLabel = updates.studentLabel;
  
  settings.lastUpdatedBy = userId;
  await settings.save();
  return settings;
};

// Delete a pipeline stage
settingsSchema.statics.deletePipelineStage = async function(stageId, userId) {
  const settings = await this.getSettings();
  const stage = settings.jobPipelineStages.find(s => s.id === stageId);
  
  if (!stage) {
    throw new Error('Stage not found');
  }
  
  if (stage.isDefault) {
    throw new Error('Cannot delete default stages');
  }
  
  settings.jobPipelineStages = settings.jobPipelineStages.filter(s => s.id !== stageId);
  
  // Reorder remaining stages
  settings.jobPipelineStages.forEach((s, idx) => {
    s.order = idx;
  });
  
  settings.lastUpdatedBy = userId;
  await settings.save();
  return settings;
};

// Reorder pipeline stages
settingsSchema.statics.reorderPipelineStages = async function(stageIds, userId) {
  const settings = await this.getSettings();
  
  // Validate all IDs exist
  const existingIds = settings.jobPipelineStages.map(s => s.id);
  for (const id of stageIds) {
    if (!existingIds.includes(id)) {
      throw new Error(`Stage ${id} not found`);
    }
  }
  
  // Reorder based on the new order
  const reordered = stageIds.map((id, index) => {
    const stage = settings.jobPipelineStages.find(s => s.id === id);
    stage.order = index;
    return stage;
  });
  
  settings.jobPipelineStages = reordered;
  settings.lastUpdatedBy = userId;
  await settings.save();
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
