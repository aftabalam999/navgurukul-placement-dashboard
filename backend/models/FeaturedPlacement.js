const mongoose = require('mongoose');

const featuredPlacementSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: false
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: false
    },
    // Manual details (if not linked to system entities)
    manualStudentName: String,
    manualJobTitle: String,
    manualCompanyName: String,
    manualStudentAvatar: String,
    manualPackage: String,
    manualCampus: String,
    manualBatch: String,
    // Custom hero image (optional - if not provided, uses student avatar)
    heroImage: {
        type: String,
        default: null
    },
    // Custom quote/testimonial
    customQuote: {
        type: String,
        default: null
    },
    // Display order (lower numbers appear first)
    displayOrder: {
        type: Number,
        default: 0
    },
    // Whether to show in carousel
    isActive: {
        type: Boolean,
        default: true
    },
    // Who featured this placement
    featuredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // When it was featured
    featuredAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
featuredPlacementSchema.index({ isActive: 1, displayOrder: 1 });
featuredPlacementSchema.index({ student: 1 });
featuredPlacementSchema.index({ application: 1 });

module.exports = mongoose.model('FeaturedPlacement', featuredPlacementSchema);
