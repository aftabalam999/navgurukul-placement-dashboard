const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const Skill = require('../models/Skill');
const { auth, authorize } = require('../middleware/auth');
const AIService = require('../services/aiService');
const multer = require('multer');

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Parse JD with AI (PDF or URL)
router.post('/parse-jd', auth, authorize('coordinator', 'manager'), upload.single('pdf'), async (req, res) => {
  try {
    const { url } = req.body;
    const pdfFile = req.file;

    if (!url && !pdfFile) {
      return res.status(400).json({ message: 'Please provide either a PDF file or a URL' });
    }

    // Get AI config from settings
    const settings = await Settings.getSettings();
    const apiKey = settings.aiConfig?.googleApiKey;

    // Get existing skills for better matching
    let existingSkills = [];
    let skillNames = [];
    try {
      existingSkills = await Skill.find({ isActive: true }).select('name');
      skillNames = existingSkills.map(s => s.name);
    } catch (skillError) {
      console.warn('Could not fetch skills:', skillError.message);
    }

    const aiService = new AIService(apiKey);
    let text = '';

    // Extract text from PDF or URL
    try {
      if (pdfFile) {
        text = await aiService.extractTextFromPDF(pdfFile.buffer);
      } else if (url) {
        text = await aiService.extractTextFromURL(url);
      }
    } catch (extractError) {
      return res.status(400).json({ 
        message: extractError.message || 'Failed to extract content from the provided source.',
        success: false
      });
    }

    if (!text || text.length < 50) {
      return res.status(400).json({ 
        message: 'Could not extract enough text from the provided source. Please try a different file or URL.' 
      });
    }

    let parsedData;
    
    // Try AI parsing first, fallback to regex
    if (apiKey && settings.aiConfig?.enabled !== false) {
      try {
        parsedData = await aiService.parseJobDescription(text, skillNames);
        parsedData.parsedWith = 'ai';
      } catch (aiError) {
        console.error('AI parsing failed, using fallback:', aiError.message);
        parsedData = aiService.parseJobDescriptionFallback(text);
        parsedData.parsedWith = 'fallback';
        parsedData.aiError = aiError.message;
      }
    } else {
      // No API key - use fallback
      parsedData = aiService.parseJobDescriptionFallback(text);
      parsedData.parsedWith = 'fallback';
      parsedData.aiError = 'AI not configured. Using basic extraction.';
    }

    // Match suggested skills with existing skills in database
    if (parsedData.suggestedSkills?.length > 0 && existingSkills.length > 0) {
      const matchedSkills = existingSkills.filter(skill => 
        parsedData.suggestedSkills.some(suggested => 
          skill.name.toLowerCase().includes(suggested.toLowerCase()) ||
          suggested.toLowerCase().includes(skill.name.toLowerCase())
        )
      );
      parsedData.matchedSkillIds = matchedSkills.map(s => s._id);
    }

    res.json({
      success: true,
      data: parsedData,
      message: parsedData.parsedWith === 'ai' 
        ? 'Job description parsed successfully with AI' 
        : 'Parsed with basic extraction. Add Google AI API key in Settings for better results.'
    });

  } catch (error) {
    console.error('Parse JD error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to parse job description',
      success: false
    });
  }
});

// Get all jobs (filtered by role and eligibility)
router.get('/', auth, async (req, res) => {
  try {
    const { 
      status, company, jobType, campus, search,
      page = 1, limit = 20 
    } = req.query;

    let query = {};

    // Students only see active jobs
    if (req.user.role === 'student') {
      query.status = 'active';
      query.applicationDeadline = { $gte: new Date() };
      
      // Filter by student's campus
      if (req.user.campus) {
        query.$or = [
          { 'eligibility.campuses': { $size: 0 } },
          { 'eligibility.campuses': req.user.campus }
        ];
      }
    } else {
      if (status) query.status = status;
    }

    if (company) {
      query['company.name'] = { $regex: company, $options: 'i' };
    }

    if (jobType) {
      // Support comma-separated job types (e.g., "full_time,part_time,contract")
      const jobTypes = jobType.split(',').map(t => t.trim());
      if (jobTypes.length > 1) {
        query.jobType = { $in: jobTypes };
      } else {
        query.jobType = jobType;
      }
    }

    if (campus) {
      query['eligibility.campuses'] = campus;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const jobs = await Job.find(query)
      .populate('requiredSkills.skill')
      .populate('eligibility.campuses', 'name')
      .populate('createdBy', 'firstName lastName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get matching jobs for student
router.get('/matching', auth, authorize('student'), async (req, res) => {
  try {
    const student = await User.findById(req.userId)
      .populate('studentProfile.skills.skill');

    const approvedSkillIds = student.studentProfile.skills
      .filter(s => s.status === 'approved')
      .map(s => s.skill._id);

    const jobs = await Job.find({
      status: 'active',
      applicationDeadline: { $gte: new Date() },
      'requiredSkills.skill': { $in: approvedSkillIds }
    })
      .populate('requiredSkills.skill')
      .populate('eligibility.campuses', 'name')
      .sort({ createdAt: -1 });

    // Calculate match percentage for each job
    const jobsWithMatch = jobs.map(job => {
      const requiredSkillIds = job.requiredSkills.map(s => s.skill._id.toString());
      const matchingSkills = requiredSkillIds.filter(
        skillId => approvedSkillIds.map(id => id.toString()).includes(skillId)
      );
      const matchPercentage = Math.round((matchingSkills.length / requiredSkillIds.length) * 100);

      return {
        ...job.toObject(),
        matchPercentage,
        matchingSkillsCount: matchingSkills.length,
        totalRequiredSkills: requiredSkillIds.length
      };
    });

    // Sort by match percentage
    jobsWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json(jobsWithMatch);
  } catch (error) {
    console.error('Get matching jobs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single job
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('requiredSkills.skill')
      .populate('eligibility.campuses', 'name code')
      .populate('createdBy', 'firstName lastName');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create job (Coordinators only)
router.post('/', auth, authorize('coordinator', 'manager'), [
  body('title').trim().notEmpty(),
  body('company.name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('location').trim().notEmpty(),
  body('applicationDeadline').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const jobData = {
      ...req.body,
      createdBy: req.userId
    };

    const job = new Job(jobData);
    await job.save();

    // Notify eligible students if job is active
    if (job.status === 'active') {
      const eligibleStudents = await User.find({
        role: 'student',
        isActive: true,
        campus: job.eligibility.campuses?.length > 0 
          ? { $in: job.eligibility.campuses }
          : { $exists: true }
      });

      const notifications = eligibleStudents.map(student => ({
        recipient: student._id,
        type: 'new_job_posting',
        title: 'New Job Opportunity',
        message: `${job.company.name} is hiring for ${job.title}. Apply now!`,
        link: `/jobs/${job._id}`,
        relatedEntity: { type: 'job', id: job._id }
      }));

      await Notification.insertMany(notifications);
    }

    res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update job
router.put('/:id', auth, authorize('coordinator', 'manager'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const wasNotActive = job.status !== 'active';
    Object.assign(job, req.body);
    await job.save();

    // If job just became active, notify students
    if (wasNotActive && job.status === 'active') {
      const eligibleStudents = await User.find({
        role: 'student',
        isActive: true
      });

      const notifications = eligibleStudents.map(student => ({
        recipient: student._id,
        type: 'new_job_posting',
        title: 'New Job Opportunity',
        message: `${job.company.name} is hiring for ${job.title}. Apply now!`,
        link: `/jobs/${job._id}`,
        relatedEntity: { type: 'job', id: job._id }
      }));

      await Notification.insertMany(notifications);
    }

    res.json({ message: 'Job updated successfully', job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete job
router.delete('/:id', auth, authorize('coordinator', 'manager'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await job.deleteOne();
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update job status (for Kanban drag-and-drop)
router.patch('/:id/status', auth, authorize('coordinator', 'manager'), async (req, res) => {
  try {
    const { status: newStatus, notes } = req.body;
    
    if (!newStatus) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status against pipeline stages
    const validStatuses = await Settings.getValidStatuses();
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ 
        message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}` 
      });
    }

    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const previousStatus = job.status;

    // Update status
    job.status = newStatus;
    
    // Add to status history
    job.statusHistory = job.statusHistory || [];
    job.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      changedBy: req.userId,
      notes: notes || ''
    });

    await job.save();

    // Get pipeline settings to check if we should notify students
    const settings = await Settings.getSettings();
    const newStage = settings.jobPipelineStages.find(s => s.id === newStatus);
    const prevStage = settings.jobPipelineStages.find(s => s.id === previousStatus);
    
    // Notify students if job became visible (moved to a student-visible stage from non-visible)
    const wasVisible = prevStage?.visibleToStudents;
    const isNowVisible = newStage?.visibleToStudents;
    
    if (!wasVisible && isNowVisible && newStatus !== 'closed' && newStatus !== 'filled') {
      const eligibleStudents = await User.find({
        role: 'student',
        isActive: true,
        campus: job.eligibility.campuses?.length > 0 
          ? { $in: job.eligibility.campuses }
          : { $exists: true }
      });

      const notifications = eligibleStudents.map(student => ({
        recipient: student._id,
        type: 'new_job_posting',
        title: 'New Job Opportunity',
        message: `${job.company.name} is hiring for ${job.title}. Apply now!`,
        link: `/jobs/${job._id}`,
        relatedEntity: { type: 'job', id: job._id }
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    // Populate job for response
    await job.populate('requiredSkills.skill');
    await job.populate('eligibility.campuses', 'name');
    await job.populate('createdBy', 'firstName lastName');

    res.json({ 
      message: 'Job status updated successfully', 
      job,
      previousStatus,
      newStatus
    });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
