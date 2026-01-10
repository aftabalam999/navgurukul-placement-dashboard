import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI, skillAPI, campusAPI } from '../../services/api';
import { LoadingSpinner } from '../../components/common/UIComponents';
import { ArrowLeft, Save, Plus, X, Sparkles, Upload, Link, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [jdUrl, setJdUrl] = useState('');
  const [aiParseInfo, setAiParseInfo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    company: { name: '', website: '', description: '' },
    description: '',
    requirements: [''],
    responsibilities: [''],
    customRequirements: [], // New: visible requirements for students
    location: '',
    jobType: 'full_time',
    duration: '', // For internships
    salary: { min: '', max: '', currency: 'INR' },
    requiredSkills: [], // Now includes proficiencyLevel
    eligibility: { 
      openForAll: true,
      // Academic requirements
      tenthGrade: { required: false, minPercentage: '' },
      twelfthGrade: { required: false, minPercentage: '' },
      higherEducation: { required: false, acceptedDegrees: [] },
      // Navgurukul specific
      schools: [],
      campuses: [],
      minModule: '',
      // Legacy
      minCgpa: ''
    },
    applicationDeadline: '',
    maxPositions: 1,
    status: 'draft',
    interviewRounds: [{ name: '', type: 'technical', description: '' }]
  });

  // Available degree options
  const degreeOptions = [
    'Any Graduate',
    '10th Pass',
    '12th Pass',
    'BA', 'BSc', 'BCom', 'BCA', 'BTech', 'BE', 'BBA',
    'MA', 'MSc', 'MCom', 'MCA', 'MTech', 'ME', 'MBA',
    'Diploma', 'ITI', 'Other'
  ];

  // Module hierarchy for School of Programming
  const moduleHierarchy = [
    'Foundation',
    'Basics of Programming',
    'DSA',
    'Backend',
    'Full Stack',
    'Interview Prep'
  ];

  // Proficiency level labels
  const proficiencyLevels = [
    { value: 0, label: 'None', description: 'Not required' },
    { value: 1, label: 'Beginner', description: 'Basic understanding' },
    { value: 2, label: 'Intermediate', description: 'Can work independently' },
    { value: 3, label: 'Advanced', description: 'Deep expertise' },
    { value: 4, label: 'Expert', description: 'Industry expert level' }
  ];

  useEffect(() => {
    fetchSkills();
    fetchCampuses();
    if (isEdit) fetchJob();
  }, [id]);

  const fetchSkills = async () => {
    try {
      const response = await skillAPI.getSkills();
      setAllSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const fetchCampuses = async () => {
    try {
      const response = await campusAPI.getCampuses();
      setCampuses(response.data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };

  // AI Auto-fill from URL
  const handleParseFromUrl = async () => {
    if (!jdUrl.trim()) {
      toast.error('Please enter a JD URL');
      return;
    }

    setParsing(true);
    setAiParseInfo(null);
    
    try {
      const response = await jobAPI.parseJDFromUrl(jdUrl);
      if (response.data.success) {
        applyParsedData(response.data.data);
        setAiParseInfo({
          type: response.data.data.parsedWith,
          message: response.data.message
        });
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to parse JD from URL');
    } finally {
      setParsing(false);
    }
  };

  // AI Auto-fill from PDF
  const handleParseFromPDF = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setParsing(true);
    setAiParseInfo(null);
    
    try {
      const response = await jobAPI.parseJDFromPDF(file);
      if (response.data.success) {
        applyParsedData(response.data.data);
        setAiParseInfo({
          type: response.data.data.parsedWith,
          message: response.data.message
        });
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to parse PDF');
    } finally {
      setParsing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Apply parsed data to form
  const applyParsedData = (data) => {
    setFormData(prev => ({
      ...prev,
      title: data.title || prev.title,
      company: {
        name: data.company?.name || prev.company.name,
        website: data.company?.website || prev.company.website,
        description: data.company?.description || prev.company.description
      },
      description: data.description || prev.description,
      requirements: data.requirements?.length > 0 ? data.requirements : prev.requirements,
      responsibilities: data.responsibilities?.length > 0 ? data.responsibilities : prev.responsibilities,
      location: data.location || prev.location,
      jobType: data.jobType || prev.jobType,
      duration: data.duration || prev.duration,
      salary: {
        min: data.salary?.min || prev.salary.min,
        max: data.salary?.max || prev.salary.max,
        currency: data.salary?.currency || prev.salary.currency
      },
      maxPositions: data.maxPositions || prev.maxPositions,
      // Add matched skills
      requiredSkills: data.matchedSkillIds?.length > 0 
        ? data.matchedSkillIds.map(id => ({ skill: id, required: true }))
        : prev.requiredSkills
    }));
  };

  const fetchJob = async () => {
    try {
      const response = await jobAPI.getJob(id);
      const job = response.data;
      setFormData({
        ...job,
        duration: job.duration || '',
        salary: job.salary || { min: '', max: '', currency: 'INR' },
        customRequirements: job.customRequirements || [],
        eligibility: {
          openForAll: job.eligibility?.openForAll ?? true,
          tenthGrade: job.eligibility?.tenthGrade || { required: false, minPercentage: '' },
          twelfthGrade: job.eligibility?.twelfthGrade || { required: false, minPercentage: '' },
          higherEducation: job.eligibility?.higherEducation || { required: false, acceptedDegrees: [] },
          schools: job.eligibility?.schools || [],
          campuses: job.eligibility?.campuses || [],
          minModule: job.eligibility?.minModule || '',
          minCgpa: job.eligibility?.minCgpa || ''
        },
        requirements: job.requirements?.length ? job.requirements : [''],
        responsibilities: job.responsibilities?.length ? job.responsibilities : [''],
        interviewRounds: job.interviewRounds?.length ? job.interviewRounds : [{ name: '', type: 'technical', description: '' }],
        applicationDeadline: job.applicationDeadline?.split('T')[0] || ''
      });
    } catch (error) {
      toast.error('Error loading job');
      navigate('/coordinator/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Clean up empty entries
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim()),
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        customRequirements: (formData.customRequirements || []).filter(r => r.requirement?.trim()),
        interviewRounds: formData.interviewRounds.filter(r => r.name.trim()),
        duration: formData.jobType === 'internship' ? formData.duration : null,
        salary: {
          min: formData.salary.min ? Number(formData.salary.min) : undefined,
          max: formData.salary.max ? Number(formData.salary.max) : undefined,
          currency: formData.salary.currency
        },
        eligibility: {
          // Academic requirements
          tenthGrade: {
            required: formData.eligibility.tenthGrade?.required || false,
            minPercentage: formData.eligibility.tenthGrade?.minPercentage ? 
              Number(formData.eligibility.tenthGrade.minPercentage) : null
          },
          twelfthGrade: {
            required: formData.eligibility.twelfthGrade?.required || false,
            minPercentage: formData.eligibility.twelfthGrade?.minPercentage ? 
              Number(formData.eligibility.twelfthGrade.minPercentage) : null
          },
          higherEducation: {
            required: formData.eligibility.higherEducation?.required || false,
            acceptedDegrees: formData.eligibility.higherEducation?.acceptedDegrees || []
          },
          // Navgurukul specific
          schools: formData.eligibility.schools || [],
          campuses: formData.eligibility.campuses || [],
          minModule: formData.eligibility.minModule || null,
          // Legacy
          minCgpa: formData.eligibility.minCgpa ? Number(formData.eligibility.minCgpa) : null,
          // Calculate openForAll
          openForAll: !formData.eligibility.tenthGrade?.required && 
                     !formData.eligibility.twelfthGrade?.required &&
                     !formData.eligibility.higherEducation?.required &&
                     (!formData.eligibility.schools || formData.eligibility.schools.length === 0) &&
                     (!formData.eligibility.campuses || formData.eligibility.campuses.length === 0) &&
                     !formData.eligibility.minModule &&
                     !formData.eligibility.minCgpa
        }
      };

      if (isEdit) {
        await jobAPI.updateJob(id, cleanedData);
        toast.success('Job updated successfully');
      } else {
        await jobAPI.createJob(cleanedData);
        toast.success('Job created successfully');
      }
      navigate('/coordinator/jobs');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving job');
    } finally {
      setSaving(false);
    }
  };

  const addListItem = (field) => {
    if (field === 'interviewRounds') {
      setFormData({
        ...formData,
        interviewRounds: [...formData.interviewRounds, { name: '', type: 'technical', description: '' }]
      });
    } else {
      setFormData({ ...formData, [field]: [...formData[field], ''] });
    }
  };

  const removeListItem = (field, index) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index)
    });
  };

  const updateListItem = (field, index, value) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const toggleSkill = (skillId, required = true) => {
    const exists = formData.requiredSkills.find(s => s.skill === skillId || s.skill?._id === skillId);
    if (exists) {
      setFormData({
        ...formData,
        requiredSkills: formData.requiredSkills.filter(s => s.skill !== skillId && s.skill?._id !== skillId)
      });
    } else {
      setFormData({
        ...formData,
        requiredSkills: [...formData.requiredSkills, { skill: skillId, required, proficiencyLevel: 1 }]
      });
    }
  };

  const updateSkillProficiency = (skillId, proficiencyLevel) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.map(s => {
        if (s.skill === skillId || s.skill?._id === skillId) {
          return { ...s, proficiencyLevel };
        }
        return s;
      })
    });
  };

  const addCustomRequirement = () => {
    setFormData({
      ...formData,
      customRequirements: [...(formData.customRequirements || []), { requirement: '', isMandatory: true }]
    });
  };

  const updateCustomRequirement = (index, field, value) => {
    const updated = [...(formData.customRequirements || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, customRequirements: updated });
  };

  const removeCustomRequirement = (index) => {
    setFormData({
      ...formData,
      customRequirements: (formData.customRequirements || []).filter((_, i) => i !== index)
    });
  };

  const schools = [
    'School of Programming',
    'School of Business', 
    'School of Finance',
    'School of Education',
    'School of Second Chance'
  ];

  // Check if eligibility has any restrictions
  const hasEligibilityRestrictions = formData.eligibility.tenthGrade?.required ||
    formData.eligibility.twelfthGrade?.required ||
    formData.eligibility.higherEducation?.required ||
    (formData.eligibility.schools && formData.eligibility.schools.length > 0) ||
    (formData.eligibility.campuses && formData.eligibility.campuses.length > 0) ||
    formData.eligibility.minModule ||
    formData.eligibility.minCgpa;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => navigate('/coordinator/jobs')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Job' : 'Create New Job'}</h1>
        <p className="text-gray-600">Fill in the job details below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI Auto-Fill Section */}
        {!isEdit && (
          <div className="card bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-purple-900">AI Auto-Fill</h2>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Beta</span>
            </div>
            <p className="text-sm text-purple-700 mb-4">
              Upload a JD PDF or paste a job posting URL to automatically fill the form using AI.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-1">
                  <Link className="w-4 h-4 inline mr-1" />
                  JD URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                    placeholder="https://careers.example.com/job/..."
                    className="flex-1"
                    disabled={parsing}
                  />
                  <button
                    type="button"
                    onClick={handleParseFromUrl}
                    disabled={parsing || !jdUrl.trim()}
                    className="btn btn-primary whitespace-nowrap flex items-center gap-2"
                  >
                    {parsing ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Parse URL
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Upload JD PDF
                </label>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleParseFromPDF}
                    className="hidden"
                    disabled={parsing}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                    className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    {parsing ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Choose PDF File
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Parse Info */}
            {aiParseInfo && (
              <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
                aiParseInfo.type === 'ai' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <AlertCircle className={`w-5 h-5 shrink-0 ${
                  aiParseInfo.type === 'ai' ? 'text-green-600' : 'text-yellow-600'
                }`} />
                <div className="text-sm">
                  <p className={aiParseInfo.type === 'ai' ? 'text-green-700' : 'text-yellow-700'}>
                    {aiParseInfo.message}
                  </p>
                  {aiParseInfo.type === 'fallback' && (
                    <p className="text-yellow-600 mt-1">
                      💡 Tip: Add your Google AI API key in Manager Settings for better results.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Software Engineer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={formData.company.name}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, name: e.target.value } })}
                placeholder="Company name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Website</label>
              <input
                type="url"
                value={formData.company.website}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, website: e.target.value } })}
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
              <textarea
                rows={2}
                value={formData.company.description}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, description: e.target.value } })}
                placeholder="Brief description of the company"
              />
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Bangalore, Remote"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select
                value={formData.jobType}
                onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            {formData.jobType === 'internship' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                >
                  <option value="">Select Duration</option>
                  <option value="1 month">1 Month</option>
                  <option value="2 months">2 Months</option>
                  <option value="3 months">3 Months</option>
                  <option value="6 months">6 Months</option>
                  <option value="1 year">1 Year</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.jobType === 'internship' ? 'Min Stipend (Monthly)' : 'Min Salary (Annual)'}
              </label>
              <input
                type="number"
                value={formData.salary.min}
                onChange={(e) => setFormData({ ...formData, salary: { ...formData.salary, min: e.target.value } })}
                placeholder={formData.jobType === 'internship' ? 'e.g., 10000' : 'e.g., 600000'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.jobType === 'internship' ? 'Max Stipend (Monthly)' : 'Max Salary (Annual)'}
              </label>
              <input
                type="number"
                value={formData.salary.max}
                onChange={(e) => setFormData({ ...formData, salary: { ...formData.salary, max: e.target.value } })}
                placeholder={formData.jobType === 'internship' ? 'e.g., 25000' : 'e.g., 1000000'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Positions</label>
              <input
                type="number"
                min="1"
                value={formData.maxPositions}
                onChange={(e) => setFormData({ ...formData, maxPositions: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed job description..."
                required
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Requirements</h2>
            <button type="button" onClick={() => addListItem('requirements')} className="text-primary-600 text-sm">
              + Add Requirement
            </button>
          </div>
          <div className="space-y-2">
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => updateListItem('requirements', index, e.target.value)}
                  placeholder="e.g., BS in Computer Science"
                />
                {formData.requirements.length > 1 && (
                  <button type="button" onClick={() => removeListItem('requirements', index)} className="p-2 text-red-500">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Custom Requirements for Students */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Custom Requirements</h2>
              <p className="text-sm text-gray-500">These will be shown to students who must confirm each one (Yes/No)</p>
            </div>
            <button type="button" onClick={addCustomRequirement} className="text-primary-600 text-sm">
              + Add Requirement
            </button>
          </div>
          <div className="space-y-3">
            {(formData.customRequirements || []).map((req, index) => (
              <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={req.requirement}
                  onChange={(e) => updateCustomRequirement(index, 'requirement', e.target.value)}
                  placeholder="e.g., Willing to relocate to Bangalore?"
                  className="flex-1"
                />
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={req.isMandatory}
                    onChange={(e) => updateCustomRequirement(index, 'isMandatory', e.target.checked)}
                  />
                  Mandatory
                </label>
                <button
                  type="button"
                  onClick={() => removeCustomRequirement(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!formData.customRequirements || formData.customRequirements.length === 0) && (
              <p className="text-gray-500 text-sm italic">No custom requirements added yet</p>
            )}
          </div>
        </div>

        {/* Required Skills with Proficiency Levels */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Required Skills</h2>
            <p className="text-sm text-gray-500">Select skills and set the minimum proficiency level required</p>
          </div>
          
          {/* Selected Skills with Proficiency */}
          {formData.requiredSkills.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Selected Skills:</p>
              {formData.requiredSkills.map((selectedSkill) => {
                const skillId = selectedSkill.skill?._id || selectedSkill.skill;
                const skillInfo = allSkills.find(s => s._id === skillId);
                if (!skillInfo) return null;
                return (
                  <div key={skillId} className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                    <span className="font-medium text-primary-800 min-w-32">{skillInfo.name}</span>
                    <select
                      value={selectedSkill.proficiencyLevel || 1}
                      onChange={(e) => updateSkillProficiency(skillId, parseInt(e.target.value))}
                      className="text-sm"
                    >
                      {proficiencyLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label} - {level.description}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => toggleSkill(skillId)}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Available Skills to Add */}
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => {
              const isSelected = formData.requiredSkills.some(s => s.skill === skill._id || s.skill?._id === skill._id);
              if (isSelected) return null; // Don't show already selected skills
              return (
                <button
                  key={skill._id}
                  type="button"
                  onClick={() => toggleSkill(skill._id)}
                  className="px-3 py-1 rounded-full text-sm transition bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  + {skill.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Eligibility */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Eligibility Criteria</h2>
            <span className="text-sm text-gray-500 italic">
              (Leave all fields empty to make it open for all students)
            </span>
          </div>
          
          {/* Open for All indicator */}
          {!hasEligibilityRestrictions && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                This {formData.jobType === 'internship' ? 'internship' : 'job'} is open for all students to apply
              </p>
            </div>
          )}

          {/* Academic Requirements Section */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-3">Academic Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 10th Grade */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.eligibility.tenthGrade?.required || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      eligibility: {
                        ...formData.eligibility,
                        tenthGrade: { ...formData.eligibility.tenthGrade, required: e.target.checked }
                      }
                    })}
                  />
                  <span className="font-medium">10th Grade</span>
                </label>
                {formData.eligibility.tenthGrade?.required && (
                  <div>
                    <label className="text-xs text-gray-600">Min Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.eligibility.tenthGrade?.minPercentage || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        eligibility: {
                          ...formData.eligibility,
                          tenthGrade: { ...formData.eligibility.tenthGrade, minPercentage: e.target.value }
                        }
                      })}
                      placeholder="Any %"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* 12th Grade */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.eligibility.twelfthGrade?.required || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      eligibility: {
                        ...formData.eligibility,
                        twelfthGrade: { ...formData.eligibility.twelfthGrade, required: e.target.checked }
                      }
                    })}
                  />
                  <span className="font-medium">12th Grade</span>
                </label>
                {formData.eligibility.twelfthGrade?.required && (
                  <div>
                    <label className="text-xs text-gray-600">Min Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.eligibility.twelfthGrade?.minPercentage || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        eligibility: {
                          ...formData.eligibility,
                          twelfthGrade: { ...formData.eligibility.twelfthGrade, minPercentage: e.target.value }
                        }
                      })}
                      placeholder="Any %"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Higher Education */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.eligibility.higherEducation?.required || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      eligibility: {
                        ...formData.eligibility,
                        higherEducation: { ...formData.eligibility.higherEducation, required: e.target.checked }
                      }
                    })}
                  />
                  <span className="font-medium">Higher Education</span>
                </label>
                {formData.eligibility.higherEducation?.required && (
                  <div>
                    <label className="text-xs text-gray-600">Accepted Degrees</label>
                    <div className="mt-1 max-h-24 overflow-y-auto space-y-1">
                      {degreeOptions.map(degree => (
                        <label key={degree} className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={(formData.eligibility.higherEducation?.acceptedDegrees || []).includes(degree)}
                            onChange={(e) => {
                              const current = formData.eligibility.higherEducation?.acceptedDegrees || [];
                              const updated = e.target.checked
                                ? [...current, degree]
                                : current.filter(d => d !== degree);
                              setFormData({
                                ...formData,
                                eligibility: {
                                  ...formData.eligibility,
                                  higherEducation: { ...formData.eligibility.higherEducation, acceptedDegrees: updated }
                                }
                              });
                            }}
                          />
                          {degree}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navgurukul Specific Section */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-3">Navgurukul Specific</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Schools */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Schools</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {schools.map(school => (
                    <label key={school} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(formData.eligibility.schools || []).includes(school)}
                        onChange={(e) => {
                          const newSchools = e.target.checked
                            ? [...(formData.eligibility.schools || []), school]
                            : (formData.eligibility.schools || []).filter(s => s !== school);
                          setFormData({
                            ...formData,
                            eligibility: { ...formData.eligibility, schools: newSchools }
                          });
                        }}
                      />
                      {school}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty for all schools</p>
              </div>

              {/* Campuses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campuses</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {campuses.map(campus => (
                    <label key={campus._id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(formData.eligibility.campuses || []).includes(campus._id)}
                        onChange={(e) => {
                          const newCampuses = e.target.checked
                            ? [...(formData.eligibility.campuses || []), campus._id]
                            : (formData.eligibility.campuses || []).filter(c => c !== campus._id);
                          setFormData({
                            ...formData,
                            eligibility: { ...formData.eligibility, campuses: newCampuses }
                          });
                        }}
                      />
                      {campus.name}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave empty for all campuses</p>
              </div>

              {/* Module Requirement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Module (Programming)</label>
                <select
                  value={formData.eligibility.minModule || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    eligibility: { ...formData.eligibility, minModule: e.target.value }
                  })}
                >
                  <option value="">No minimum</option>
                  {moduleHierarchy.map(module => (
                    <option key={module} value={module}>{module}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only for School of Programming</p>
              </div>
            </div>
          </div>

          {/* Legacy CGPA (for backward compatibility) */}
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-3">Other Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CGPA</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.eligibility.minCgpa}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  eligibility: { ...formData.eligibility, minCgpa: e.target.value } 
                })}
                placeholder="Any CGPA"
              />
            </div>
            </div>
          </div>
        </div>

        {/* Interview Rounds */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Interview Rounds</h2>
            <button type="button" onClick={() => addListItem('interviewRounds')} className="text-primary-600 text-sm">
              + Add Round
            </button>
          </div>
          <div className="space-y-4">
            {formData.interviewRounds.map((round, index) => (
              <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={round.name}
                    onChange={(e) => {
                      const updated = [...formData.interviewRounds];
                      updated[index].name = e.target.value;
                      setFormData({ ...formData, interviewRounds: updated });
                    }}
                    placeholder="Round name"
                  />
                  <select
                    value={round.type}
                    onChange={(e) => {
                      const updated = [...formData.interviewRounds];
                      updated[index].type = e.target.value;
                      setFormData({ ...formData, interviewRounds: updated });
                    }}
                  >
                    <option value="aptitude">Aptitude Test</option>
                    <option value="technical">Technical Interview</option>
                    <option value="coding">Coding Test</option>
                    <option value="hr">HR Interview</option>
                    <option value="group_discussion">Group Discussion</option>
                    <option value="other">Other</option>
                  </select>
                  {formData.interviewRounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeListItem('interviewRounds', index)}
                      className="text-red-500 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status & Submit */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-48"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/coordinator/jobs')} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : isEdit ? 'Update Job' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
