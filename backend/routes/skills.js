const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const { auth, authorize } = require('../middleware/auth');

// Get all skills
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, active = 'true' } = req.query;
    let query = {};

    if (active === 'true') {
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skills = await Skill.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get skill categories
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = [
      { value: 'technical', label: 'Technical Skills' },
      { value: 'soft_skill', label: 'Soft Skills' },
      { value: 'language', label: 'Languages' },
      { value: 'certification', label: 'Certifications' },
      { value: 'domain', label: 'Domain Knowledge' },
      { value: 'other', label: 'Other' }
    ];

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single skill
router.get('/:id', auth, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    res.json(skill);
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create skill (Coordinators only)
router.post('/', auth, authorize('coordinator', 'manager'), [
  body('name').trim().notEmpty(),
  body('category').isIn(['technical', 'soft_skill', 'language', 'certification', 'domain', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, category, description } = req.body;

    // Check if skill already exists
    const existingSkill = await Skill.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingSkill) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    const skill = new Skill({
      name,
      category,
      description,
      createdBy: req.userId
    });

    await skill.save();

    res.status(201).json({ message: 'Skill created successfully', skill });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update skill
router.put('/:id', auth, authorize('coordinator', 'manager'), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const { name, category, description, isActive } = req.body;

    if (name) skill.name = name;
    if (category) skill.category = category;
    if (description !== undefined) skill.description = description;
    if (isActive !== undefined) skill.isActive = isActive;

    await skill.save();

    res.json({ message: 'Skill updated successfully', skill });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete skill
router.delete('/:id', auth, authorize('coordinator', 'manager'), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    // Soft delete - deactivate instead of removing
    skill.isActive = false;
    await skill.save();

    res.json({ message: 'Skill deactivated successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
