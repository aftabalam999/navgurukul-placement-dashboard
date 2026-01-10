const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { auth, authorize } = require('../middleware/auth');

// Get all settings (public - for dropdowns and forms)
router.get('/', auth, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Convert Map to plain object for JSON response
    const response = {
      schoolModules: Object.fromEntries(settings.schoolModules || new Map()),
      rolePreferences: settings.rolePreferences || [],
      technicalSkills: settings.technicalSkills || [],
      degreeOptions: settings.degreeOptions || [],
      softSkills: settings.softSkills || []
    };
    
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update all settings (manager/coordinator only)
router.put('/', auth, authorize('manager', 'coordinator'), async (req, res) => {
  try {
    const { schoolModules, rolePreferences, technicalSkills, degreeOptions, softSkills } = req.body;
    
    const settings = await Settings.updateSettings({
      schoolModules,
      rolePreferences,
      technicalSkills,
      degreeOptions,
      softSkills
    }, req.userId);
    
    // Convert Map to plain object for JSON response
    const response = {
      schoolModules: Object.fromEntries(settings.schoolModules || new Map()),
      rolePreferences: settings.rolePreferences || [],
      technicalSkills: settings.technicalSkills || [],
      degreeOptions: settings.degreeOptions || [],
      softSkills: settings.softSkills || []
    };
    
    res.json({ 
      success: true, 
      message: 'Settings updated successfully', 
      data: response 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add module to a school (manager/coordinator only)
router.post('/schools/:school/modules', auth, authorize('manager', 'coordinator'), async (req, res) => {
  try {
    const { school } = req.params;
    const { module } = req.body;
    
    const settings = await Settings.getSettings();
    const modules = settings.schoolModules.get(school) || [];
    
    if (modules.includes(module)) {
      return res.status(400).json({ success: false, message: 'Module already exists' });
    }
    
    modules.push(module);
    settings.schoolModules.set(school, modules);
    settings.lastUpdatedBy = req.userId;
    await settings.save();
    
    res.json({ 
      success: true, 
      message: 'Module added successfully',
      data: { school, modules }
    });
  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove module from a school (manager/coordinator only)
router.delete('/schools/:school/modules/:module', auth, authorize('manager', 'coordinator'), async (req, res) => {
  try {
    const { school, module } = req.params;
    
    const settings = await Settings.getSettings();
    const modules = settings.schoolModules.get(school) || [];
    
    const index = modules.indexOf(decodeURIComponent(module));
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }
    
    modules.splice(index, 1);
    settings.schoolModules.set(school, modules);
    settings.lastUpdatedBy = req.userId;
    await settings.save();
    
    res.json({ 
      success: true, 
      message: 'Module removed successfully',
      data: { school, modules }
    });
  } catch (error) {
    console.error('Remove module error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add role preference (manager/coordinator only)
router.post('/roles', auth, authorize('manager', 'coordinator'), async (req, res) => {
  try {
    const { role } = req.body;
    
    const settings = await Settings.getSettings();
    
    if (settings.rolePreferences.includes(role)) {
      return res.status(400).json({ success: false, message: 'Role already exists' });
    }
    
    settings.rolePreferences.push(role);
    settings.lastUpdatedBy = req.userId;
    await settings.save();
    
    res.json({ 
      success: true, 
      message: 'Role added successfully',
      data: { rolePreferences: settings.rolePreferences }
    });
  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove role preference (manager/coordinator only)
router.delete('/roles/:role', auth, authorize('manager', 'coordinator'), async (req, res) => {
  try {
    const { role } = req.params;
    
    const settings = await Settings.getSettings();
    const index = settings.rolePreferences.indexOf(decodeURIComponent(role));
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    
    settings.rolePreferences.splice(index, 1);
    settings.lastUpdatedBy = req.userId;
    await settings.save();
    
    res.json({ 
      success: true, 
      message: 'Role removed successfully',
      data: { rolePreferences: settings.rolePreferences }
    });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add technical skill (manager/coordinator only)
router.post('/skills', auth, authorize('manager', 'coordinator'), async (req, res) => {
  try {
    const { skill } = req.body;
    
    const settings = await Settings.getSettings();
    
    if (settings.technicalSkills.includes(skill)) {
      return res.status(400).json({ success: false, message: 'Skill already exists' });
    }
    
    settings.technicalSkills.push(skill);
    settings.lastUpdatedBy = req.userId;
    await settings.save();
    
    res.json({ 
      success: true, 
      message: 'Skill added successfully',
      data: { technicalSkills: settings.technicalSkills }
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove technical skill (manager/coordinator only)
router.delete('/skills/:skill', auth, authorize('manager', 'coordinator'), async (req, res) => {
  try {
    const { skill } = req.params;
    
    const settings = await Settings.getSettings();
    const index = settings.technicalSkills.indexOf(decodeURIComponent(skill));
    
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Skill not found' });
    }
    
    settings.technicalSkills.splice(index, 1);
    settings.lastUpdatedBy = req.userId;
    await settings.save();
    
    res.json({ 
      success: true, 
      message: 'Skill removed successfully',
      data: { technicalSkills: settings.technicalSkills }
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add course skill (any authenticated user can add - becomes available to all)
router.post('/course-skills', auth, async (req, res) => {
  try {
    const { skill } = req.body;
    
    if (!skill || typeof skill !== 'string' || skill.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid skill name' });
    }
    
    const settings = await Settings.getSettings();
    const normalizedSkill = skill.trim();
    
    // Check if skill already exists in courseSkills or technicalSkills
    const allSkills = [...(settings.courseSkills || []), ...(settings.technicalSkills || [])];
    if (allSkills.some(s => s.toLowerCase() === normalizedSkill.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Skill already exists' });
    }
    
    if (!settings.courseSkills) settings.courseSkills = [];
    settings.courseSkills.push(normalizedSkill);
    settings.lastUpdatedBy = req.userId;
    await settings.save();
    
    res.json({ 
      success: true, 
      message: 'Course skill added successfully',
      data: { 
        courseSkills: settings.courseSkills,
        allSkills: [...settings.technicalSkills, ...settings.courseSkills]
      }
    });
  } catch (error) {
    console.error('Add course skill error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ==================== PIPELINE STAGES ROUTES ====================

// Get all pipeline stages (public for dropdowns)
router.get('/pipeline-stages', auth, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const stages = settings.jobPipelineStages.sort((a, b) => a.order - b.order);
    
    res.json({ 
      success: true, 
      data: stages 
    });
  } catch (error) {
    console.error('Get pipeline stages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new pipeline stage (coordinator/manager only)
router.post('/pipeline-stages', auth, authorize('coordinator', 'manager'), async (req, res) => {
  try {
    const { id, label, description, color, order, visibleToStudents, studentLabel } = req.body;
    
    if (!label || label.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Stage label is required' });
    }
    
    const stage = {
      id: id || label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      label: label.trim(),
      description: description || '',
      color: color || 'gray',
      order,
      isDefault: false,
      visibleToStudents: visibleToStudents !== false,
      studentLabel: studentLabel || ''
    };
    
    const settings = await Settings.addPipelineStage(stage, req.userId);
    
    res.json({ 
      success: true, 
      message: 'Pipeline stage created successfully',
      data: settings.jobPipelineStages.sort((a, b) => a.order - b.order)
    });
  } catch (error) {
    console.error('Create pipeline stage error:', error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

// Update a pipeline stage (coordinator/manager only)
router.put('/pipeline-stages/:stageId', auth, authorize('coordinator', 'manager'), async (req, res) => {
  try {
    const { stageId } = req.params;
    const { label, description, color, visibleToStudents, studentLabel } = req.body;
    
    const settings = await Settings.updatePipelineStage(stageId, {
      label,
      description,
      color,
      visibleToStudents,
      studentLabel
    }, req.userId);
    
    res.json({ 
      success: true, 
      message: 'Pipeline stage updated successfully',
      data: settings.jobPipelineStages.sort((a, b) => a.order - b.order)
    });
  } catch (error) {
    console.error('Update pipeline stage error:', error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

// Delete a pipeline stage (coordinator/manager only)
router.delete('/pipeline-stages/:stageId', auth, authorize('coordinator', 'manager'), async (req, res) => {
  try {
    const { stageId } = req.params;
    
    const settings = await Settings.deletePipelineStage(stageId, req.userId);
    
    res.json({ 
      success: true, 
      message: 'Pipeline stage deleted successfully',
      data: settings.jobPipelineStages.sort((a, b) => a.order - b.order)
    });
  } catch (error) {
    console.error('Delete pipeline stage error:', error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

// Reorder pipeline stages (coordinator/manager only)
router.put('/pipeline-stages-order', auth, authorize('coordinator', 'manager'), async (req, res) => {
  try {
    const { stageIds } = req.body;
    
    if (!Array.isArray(stageIds) || stageIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Stage IDs array is required' });
    }
    
    const settings = await Settings.reorderPipelineStages(stageIds, req.userId);
    
    res.json({ 
      success: true, 
      message: 'Pipeline stages reordered successfully',
      data: settings.jobPipelineStages.sort((a, b) => a.order - b.order)
    });
  } catch (error) {
    console.error('Reorder pipeline stages error:', error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

// Get AI config (manager only)
router.get('/ai-config', auth, authorize('manager'), async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.json({ 
      success: true, 
      data: {
        hasApiKey: !!settings.aiConfig?.googleApiKey,
        enabled: settings.aiConfig?.enabled !== false,
        // Don't send the actual API key for security
        apiKeyPreview: settings.aiConfig?.googleApiKey 
          ? `${settings.aiConfig.googleApiKey.substring(0, 8)}...${settings.aiConfig.googleApiKey.slice(-4)}`
          : null
      }
    });
  } catch (error) {
    console.error('Get AI config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update AI config (manager only)
router.put('/ai-config', auth, authorize('manager'), async (req, res) => {
  try {
    const { googleApiKey, enabled } = req.body;
    
    const settings = await Settings.getSettings();
    
    if (!settings.aiConfig) {
      settings.aiConfig = {};
    }
    
    if (googleApiKey !== undefined) {
      settings.aiConfig.googleApiKey = googleApiKey;
    }
    
    if (enabled !== undefined) {
      settings.aiConfig.enabled = enabled;
    }
    
    settings.lastUpdatedBy = req.userId;
    await settings.save();
    
    res.json({ 
      success: true, 
      message: 'AI configuration updated successfully',
      data: {
        hasApiKey: !!settings.aiConfig.googleApiKey,
        enabled: settings.aiConfig.enabled !== false,
        apiKeyPreview: settings.aiConfig.googleApiKey 
          ? `${settings.aiConfig.googleApiKey.substring(0, 8)}...${settings.aiConfig.googleApiKey.slice(-4)}`
          : null
      }
    });
  } catch (error) {
    console.error('Update AI config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
