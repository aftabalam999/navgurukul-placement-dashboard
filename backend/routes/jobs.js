const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { auth, authorize } = require('../middleware/auth');

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

module.exports = router;
