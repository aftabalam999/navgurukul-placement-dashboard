const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'soft_skill', 'language', 'certification', 'domain', 'other']
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

module.exports = mongoose.model('Skill', skillSchema);
