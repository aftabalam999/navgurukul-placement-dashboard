const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    name: {
      type: String,
      required: true
    },
    logo: String,
    website: String,
    description: String
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  responsibilities: [String],
  location: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    enum: ['full_time', 'part_time', 'internship', 'contract'],
    default: 'full_time'
  },
  duration: {
    type: String, // e.g., "3 months", "6 months"
    default: null // Only for internships
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  requiredSkills: [{
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill'
    },
    required: {
      type: Boolean,
      default: true
    }
  }],
  eligibility: {
    // When all criteria fields are empty/null, the job is open for everyone
    minCgpa: { type: Number, default: null }, // null means no minimum CGPA requirement
    departments: { type: [String], default: [] }, // empty means all departments eligible
    batches: { type: [String], default: [] }, // empty means all batches eligible
    campuses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus'
    }], // empty means all campuses eligible
    schools: { type: [String], default: [] }, // Navgurukul schools - empty means all schools
    minModule: { type: String, default: null }, // Minimum module requirement - null means no requirement
    openForAll: { type: Boolean, default: true } // Explicit flag for open positions
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  maxPositions: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    default: 'draft'
    // Note: Validation against pipeline stages is done in routes
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  interviewRounds: [{
    name: String,
    type: {
      type: String,
      enum: ['aptitude', 'technical', 'hr', 'group_discussion', 'coding', 'other']
    },
    description: String,
    scheduledDate: Date
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  placementsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for searching
jobSchema.index({ title: 'text', 'company.name': 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
