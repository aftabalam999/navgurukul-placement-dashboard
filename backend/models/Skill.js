const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // Case-insensitive canonical form for lookups (lowercased + trimmed)
  normalizedName: {
    type: String,
    trim: true,
    lowercase: true,
    index: true // Unique index will be created via a migration once duplicates are resolved
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'soft_skill', 'office', 'language', 'certification', 'domain', 'other']
  },
  // Marks skills available to all schools (common pool)
  isCommon: {
    type: Boolean,
    default: false
  },
  // Tag skills to specific schools (optional, dynamic via Settings)
  schools: [{
    type: String,
    trim: true
  }],
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure normalizedName is set from name
skillSchema.pre('save', function (next) {
  if (this.isModified('name') && this.name) {
    this.normalizedName = this.name.toString().trim().toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Skill', skillSchema);
