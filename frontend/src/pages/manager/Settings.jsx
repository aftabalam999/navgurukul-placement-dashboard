import { useState, useEffect } from 'react';
import { settingsAPI, placementCycleAPI, campusAPI } from '../../services/api';
import { Card, Button, Badge, LoadingSpinner, Alert } from '../../components/common/UIComponents';

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('modules');

  // Edit states
  const [editingSchool, setEditingSchool] = useState(null);
  const [newModule, setNewModule] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newDegree, setNewDegree] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');

  // Placement cycle states
  const [placementCycles, setPlacementCycles] = useState([]);
  const [newCycle, setNewCycle] = useState({ month: '', year: '', description: '' });
  const [creatingCycle, setCreatingCycle] = useState(false);
  const [campuses, setCampuses] = useState([]);

  // AI Config states
  const [aiConfig, setAiConfig] = useState({ hasApiKey: false, enabled: true, apiKeyPreview: null });
  const [newApiKey, setNewApiKey] = useState('');
  const [savingAiConfig, setSavingAiConfig] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchPlacementCycles();
    fetchCampuses();
    fetchAiConfig();
  }, []);

  const fetchAiConfig = async () => {
    try {
      const response = await settingsAPI.getAIConfig();
      setAiConfig(response.data.data);
    } catch (err) {
      console.error('Error fetching AI config:', err);
    }
  };

  const saveAiConfig = async () => {
    try {
      setSavingAiConfig(true);
      await settingsAPI.updateAIConfig({
        googleApiKey: newApiKey || undefined,
        enabled: aiConfig.enabled
      });
      setSuccess('AI configuration saved successfully');
      setNewApiKey('');
      fetchAiConfig();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save AI configuration');
    } finally {
      setSavingAiConfig(false);
    }
  };

  const toggleAiEnabled = async () => {
    try {
      await settingsAPI.updateAIConfig({ enabled: !aiConfig.enabled });
      setAiConfig(prev => ({ ...prev, enabled: !prev.enabled }));
      setSuccess(aiConfig.enabled ? 'AI disabled' : 'AI enabled');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update AI status');
    }
  };

  const fetchPlacementCycles = async () => {
    try {
      const response = await placementCycleAPI.getCycles();
      setPlacementCycles(response.data);
    } catch (err) {
      console.error('Error fetching placement cycles:', err);
    }
  };

  const fetchCampuses = async () => {
    try {
      const response = await campusAPI.getCampuses();
      setCampuses(response.data);
    } catch (err) {
      console.error('Error fetching campuses:', err);
    }
  };

  const createPlacementCycle = async () => {
    if (!newCycle.month || !newCycle.year) {
      setError('Please select month and year');
      return;
    }
    try {
      setCreatingCycle(true);
      await placementCycleAPI.createCycle({
        month: parseInt(newCycle.month),
        year: parseInt(newCycle.year),
        description: newCycle.description
      });
      setSuccess('Placement cycle created');
      setNewCycle({ month: '', year: '', description: '' });
      fetchPlacementCycles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create placement cycle');
    } finally {
      setCreatingCycle(false);
    }
  };

  const toggleCycleActive = async (cycleId, isActive) => {
    try {
      await placementCycleAPI.updateCycle(cycleId, { isActive: !isActive });
      setSuccess(isActive ? 'Cycle deactivated' : 'Cycle activated');
      fetchPlacementCycles();
    } catch (err) {
      setError('Failed to update cycle status');
    }
  };

  const deletePlacementCycle = async (cycleId) => {
    if (!confirm('Are you sure you want to delete this placement cycle?')) return;
    try {
      await placementCycleAPI.deleteCycle(cycleId);
      setSuccess('Placement cycle deleted');
      fetchPlacementCycles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete placement cycle');
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      setSettings(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      await settingsAPI.updateSettings(settings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Module management
  const addModule = (school) => {
    if (!newModule.trim()) return;
    const updatedModules = { ...settings.schoolModules };
    updatedModules[school] = [...(updatedModules[school] || []), newModule.trim()];
    setSettings({ ...settings, schoolModules: updatedModules });
    setNewModule('');
  };

  const removeModule = (school, module) => {
    const updatedModules = { ...settings.schoolModules };
    updatedModules[school] = updatedModules[school].filter(m => m !== module);
    setSettings({ ...settings, schoolModules: updatedModules });
  };

  const moveModule = (school, index, direction) => {
    const updatedModules = { ...settings.schoolModules };
    const modules = [...updatedModules[school]];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;
    [modules[index], modules[newIndex]] = [modules[newIndex], modules[index]];
    updatedModules[school] = modules;
    setSettings({ ...settings, schoolModules: updatedModules });
  };

  // Role preferences management
  const addRole = () => {
    if (!newRole.trim() || settings.rolePreferences.includes(newRole.trim())) return;
    setSettings({ ...settings, rolePreferences: [...settings.rolePreferences, newRole.trim()] });
    setNewRole('');
  };

  const removeRole = (role) => {
    setSettings({ ...settings, rolePreferences: settings.rolePreferences.filter(r => r !== role) });
  };

  // Technical skills management
  const addSkill = () => {
    if (!newSkill.trim() || settings.technicalSkills.includes(newSkill.trim())) return;
    setSettings({ ...settings, technicalSkills: [...settings.technicalSkills, newSkill.trim()] });
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    setSettings({ ...settings, technicalSkills: settings.technicalSkills.filter(s => s !== skill) });
  };

  // Degree options management
  const addDegree = () => {
    if (!newDegree.trim() || settings.degreeOptions.includes(newDegree.trim())) return;
    setSettings({ ...settings, degreeOptions: [...settings.degreeOptions, newDegree.trim()] });
    setNewDegree('');
  };

  const removeDegree = (degree) => {
    setSettings({ ...settings, degreeOptions: settings.degreeOptions.filter(d => d !== degree) });
  };

  // Soft skills management
  const addSoftSkill = () => {
    if (!newSoftSkill.trim() || settings.softSkills?.includes(newSoftSkill.trim())) return;
    setSettings({ ...settings, softSkills: [...(settings.softSkills || []), newSoftSkill.trim()] });
    setNewSoftSkill('');
  };

  const removeSoftSkill = (skill) => {
    setSettings({ ...settings, softSkills: settings.softSkills.filter(s => s !== skill) });
  };

  const schools = [
    'School Of Programming',
    'School Of Business',
    'School of Second Chance',
    'School of Finance',
    'School of Education'
  ];

  const tabs = [
    { id: 'modules', label: 'School Modules', icon: '📚' },
    { id: 'roles', label: 'Role Preferences', icon: '💼' },
    { id: 'skills', label: 'Technical Skills', icon: '🔧' },
    { id: 'degrees', label: 'Degree Options', icon: '🎓' },
    { id: 'softskills', label: 'Soft Skills', icon: '🤝' },
    { id: 'cycles', label: 'Placement Cycles', icon: '📅' },
    { id: 'campuses', label: 'Campuses', icon: '🏫' },
    { id: 'ai', label: 'AI Integration', icon: '🤖' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <Alert type="error">Failed to load settings. Please refresh the page.</Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600 mt-1">Configure modules, roles, skills, and other platform options</p>
        </div>
        <Button
          variant="primary"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" onClose={() => setSuccess(null)} className="mb-4">
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* School Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <p className="text-gray-600">
            Manage the modules/phases for each Navgurukul school. The order of modules represents the learning progression.
          </p>
          
          {schools.map((school) => (
            <Card key={school} className="overflow-hidden">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setEditingSchool(editingSchool === school ? null : school)}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{school}</h3>
                  <p className="text-sm text-gray-500">
                    {settings.schoolModules?.[school]?.length || 0} modules
                  </p>
                </div>
                <svg 
                  className={`w-5 h-5 transform transition-transform ${editingSchool === school ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {editingSchool === school && (
                <div className="mt-4 pt-4 border-t">
                  {/* Add new module */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newModule}
                      onChange={(e) => setNewModule(e.target.value)}
                      placeholder="Add new module..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addModule(school)}
                    />
                    <Button variant="primary" onClick={() => addModule(school)}>
                      Add
                    </Button>
                  </div>

                  {/* Module list */}
                  <div className="space-y-2">
                    {(settings.schoolModules?.[school] || []).map((module, index) => (
                      <div 
                        key={module} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-3 font-mono text-sm">{index + 1}.</span>
                          <span className="text-gray-900">{module}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveModule(school, index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveModule(school, index, 'down')}
                            disabled={index === settings.schoolModules[school].length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeModule(school, module)}
                            className="p-1 text-red-400 hover:text-red-600 ml-2"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!settings.schoolModules?.[school] || settings.schoolModules[school].length === 0) && (
                      <p className="text-gray-500 text-center py-4">No modules added yet</p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Role Preferences Tab */}
      {activeTab === 'roles' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Placement Role Options</h3>
          <p className="text-gray-600 mb-4">
            These roles will be available for students to select as their placement preferences.
          </p>

          {/* Add new role */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Add new role..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addRole()}
            />
            <Button variant="primary" onClick={addRole}>
              Add Role
            </Button>
          </div>

          {/* Role list */}
          <div className="flex flex-wrap gap-2">
            {settings.rolePreferences?.map((role) => (
              <span 
                key={role} 
                className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {role}
                <button
                  onClick={() => removeRole(role)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {(!settings.rolePreferences || settings.rolePreferences.length === 0) && (
            <p className="text-gray-500 text-center py-4">No roles added yet</p>
          )}
        </Card>
      )}

      {/* Technical Skills Tab */}
      {activeTab === 'skills' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Skills</h3>
          <p className="text-gray-600 mb-4">
            Skills that students can add to their profile with self-assessed proficiency levels.
          </p>

          {/* Add new skill */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add new skill..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            />
            <Button variant="primary" onClick={addSkill}>
              Add Skill
            </Button>
          </div>

          {/* Skill list */}
          <div className="flex flex-wrap gap-2">
            {settings.technicalSkills?.map((skill) => (
              <span 
                key={skill} 
                className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {(!settings.technicalSkills || settings.technicalSkills.length === 0) && (
            <p className="text-gray-500 text-center py-4">No skills added yet</p>
          )}
        </Card>
      )}

      {/* Degree Options Tab */}
      {activeTab === 'degrees' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Degree Options</h3>
          <p className="text-gray-600 mb-4">
            Educational qualifications that students can select in their profile.
          </p>

          {/* Add new degree */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDegree}
              onChange={(e) => setNewDegree(e.target.value)}
              placeholder="Add new degree option..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addDegree()}
            />
            <Button variant="primary" onClick={addDegree}>
              Add Degree
            </Button>
          </div>

          {/* Degree list */}
          <div className="space-y-2">
            {settings.degreeOptions?.map((degree, index) => (
              <div 
                key={degree} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-900">{degree}</span>
                <button
                  onClick={() => removeDegree(degree)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {(!settings.degreeOptions || settings.degreeOptions.length === 0) && (
            <p className="text-gray-500 text-center py-4">No degree options added yet</p>
          )}
        </Card>
      )}

      {/* Soft Skills Tab */}
      {activeTab === 'softskills' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Soft Skills</h3>
          <p className="text-gray-600 mb-4">
            Interpersonal and professional skills that students can select for their profile.
          </p>

          {/* Add new soft skill */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSoftSkill}
              onChange={(e) => setNewSoftSkill(e.target.value)}
              placeholder="Add new soft skill..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addSoftSkill()}
            />
            <Button variant="primary" onClick={addSoftSkill}>
              Add Skill
            </Button>
          </div>

          {/* Soft skill list */}
          <div className="flex flex-wrap gap-2">
            {settings.softSkills?.map((skill) => (
              <span 
                key={skill} 
                className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {skill}
                <button
                  onClick={() => removeSoftSkill(skill)}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {(!settings.softSkills || settings.softSkills.length === 0) && (
            <p className="text-gray-500 text-center py-4">No soft skills added yet</p>
          )}
        </Card>
      )}

      {/* Placement Cycles Tab */}
      {activeTab === 'cycles' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Placement Cycles</h3>
          <p className="text-gray-600 mb-4">
            Manage monthly placement cycles. Each month is counted as one cycle for tracking placements.
          </p>

          {/* Add new cycle */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Create New Cycle</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={newCycle.month}
                  onChange={(e) => setNewCycle({ ...newCycle, month: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Month</option>
                  {['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={newCycle.year}
                  onChange={(e) => setNewCycle({ ...newCycle, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Year</option>
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newCycle.description}
                  onChange={(e) => setNewCycle({ ...newCycle, description: e.target.value })}
                  placeholder="E.g., Summer hiring drive"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={createPlacementCycle} 
              disabled={creatingCycle}
              className="mt-4"
            >
              {creatingCycle ? 'Creating...' : 'Create Cycle'}
            </Button>
          </div>

          {/* Cycles list */}
          <div className="space-y-3">
            {placementCycles.map((cycle) => (
              <div 
                key={cycle._id} 
                className="flex items-center justify-between p-4 bg-white border rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{cycle.name}</span>
                    <Badge variant={cycle.isActive ? 'success' : 'secondary'}>
                      {cycle.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {cycle.status === 'completed' && (
                      <Badge variant="primary">Completed</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {cycle.studentCount || 0} students | {cycle.placedCount || 0} placed
                    {cycle.description && ` | ${cycle.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={cycle.isActive ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => toggleCycleActive(cycle._id, cycle.isActive)}
                  >
                    {cycle.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deletePlacementCycle(cycle._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {placementCycles.length === 0 && (
            <p className="text-gray-500 text-center py-4">No placement cycles created yet</p>
          )}
        </Card>
      )}

      {/* Campuses Tab */}
      {activeTab === 'campuses' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Navgurukul Campuses</h3>
          <p className="text-gray-600 mb-4">
            View and manage campus locations. Students select their campus from this list.
          </p>

          {/* Campus list */}
          <div className="space-y-3">
            {campuses.map((campus) => (
              <div 
                key={campus._id} 
                className="flex items-center justify-between p-4 bg-white border rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{campus.name}</span>
                    <Badge variant="secondary">{campus.code}</Badge>
                    {campus.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="danger">Inactive</Badge>
                    )}
                  </div>
                  {campus.location && (
                    <p className="text-sm text-gray-500 mt-1">{campus.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {campuses.length === 0 && (
            <p className="text-gray-500 text-center py-4">No campuses found</p>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> Campus management is configured during initial setup. 
              Contact the system administrator to add or modify campuses.
            </p>
          </div>
        </Card>
      )}

      {/* AI Integration Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Job Description Parsing</h3>
            <p className="text-gray-600 mb-4">
              Enable AI to automatically extract job details from PDFs and URLs when creating new jobs.
            </p>

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="font-medium text-gray-900">AI Auto-Fill</p>
                  <p className="text-sm text-gray-500">
                    {aiConfig.hasApiKey 
                      ? `API Key: ${aiConfig.apiKeyPreview}`
                      : 'No API key configured'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={aiConfig.enabled ? 'success' : 'danger'}>
                  {aiConfig.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <button
                  onClick={toggleAiEnabled}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    aiConfig.enabled ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      aiConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); saveAiConfig(); }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google AI Studio API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    autoComplete="off"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder={aiConfig.hasApiKey ? 'Enter new key to replace' : 'Enter your API key'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingAiConfig || !newApiKey.trim()}
                  >
                    {savingAiConfig ? 'Saving...' : 'Save Key'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your free API key from{' '}
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </form>
            </div>

            {/* Features */}
            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">What AI can extract:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  'Job Title', 'Company Name', 'Location', 'Job Type',
                  'Salary Range', 'Requirements', 'Responsibilities',
                  'Skills', 'Experience Level', 'No. of Positions'
                ].map(feature => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Fallback Info */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Fallback Mode:</strong> If AI is disabled or API key is not set, 
                the system will use basic text extraction (regex-based) which provides 
                limited but still useful auto-fill functionality.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Save reminder */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-yellow-800">
            Don't forget to save your changes by clicking the "Save All Changes" button above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
