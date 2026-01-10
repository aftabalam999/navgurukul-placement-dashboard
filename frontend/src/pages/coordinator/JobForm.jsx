import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI, skillAPI, campusAPI } from '../../services/api';
import { LoadingSpinner } from '../../components/common/UIComponents';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    company: { name: '', website: '', description: '' },
    description: '',
    requirements: [''],
    responsibilities: [''],
    location: '',
    jobType: 'full_time',
    duration: '', // For internships
    salary: { min: '', max: '', currency: 'INR' },
    requiredSkills: [],
    eligibility: { 
      minCgpa: '', 
      schools: [],
      minModule: '',
      campuses: [], // Which campuses can apply (empty = all)
      openForAll: true 
    },
    applicationDeadline: '',
    maxPositions: 1,
    status: 'draft',
    interviewRounds: [{ name: '', type: 'technical', description: '' }]
  });

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

  const fetchJob = async () => {
    try {
      const response = await jobAPI.getJob(id);
      const job = response.data;
      setFormData({
        ...job,
        duration: job.duration || '',
        salary: job.salary || { min: '', max: '', currency: 'INR' },
        eligibility: job.eligibility || { minCgpa: '', schools: [], minModule: '', campuses: [], openForAll: true },
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
        interviewRounds: formData.interviewRounds.filter(r => r.name.trim()),
        duration: formData.jobType === 'internship' ? formData.duration : null,
        salary: {
          min: formData.salary.min ? Number(formData.salary.min) : undefined,
          max: formData.salary.max ? Number(formData.salary.max) : undefined,
          currency: formData.salary.currency
        },
        eligibility: {
          minCgpa: formData.eligibility.minCgpa ? Number(formData.eligibility.minCgpa) : null,
          schools: formData.eligibility.schools || [],
          minModule: formData.eligibility.minModule || null,
          campuses: formData.eligibility.campuses || [],
          openForAll: !formData.eligibility.minCgpa && 
                     (!formData.eligibility.schools || formData.eligibility.schools.length === 0) &&
                     (!formData.eligibility.campuses || formData.eligibility.campuses.length === 0) &&
                     !formData.eligibility.minModule
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
        requiredSkills: [...formData.requiredSkills, { skill: skillId, required }]
      });
    }
  };

  const schools = [
    'School of Programming',
    'School of Business', 
    'School of Finance',
    'School of Education',
    'School of Second Chance'
  ];

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

        {/* Required Skills */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => {
              const isSelected = formData.requiredSkills.some(s => s.skill === skill._id || s.skill?._id === skill._id);
              return (
                <button
                  key={skill._id}
                  type="button"
                  onClick={() => toggleSkill(skill._id)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    isSelected 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {skill.name}
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
          {(!formData.eligibility.minCgpa && 
            (!formData.eligibility.departments || formData.eligibility.departments.length === 0) &&
            (!formData.eligibility.batches || formData.eligibility.batches.length === 0) &&
            (!formData.eligibility.schools || formData.eligibility.schools.length === 0) &&
            !formData.eligibility.minModule) && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                This {formData.jobType === 'internship' ? 'internship' : 'job'} is open for all students to apply
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <option value="Programming Foundations">Programming Foundations</option>
                <option value="Web Fundamentals">Web Fundamentals</option>
                <option value="JavaScript Fundamentals">JavaScript Fundamentals</option>
                <option value="Advanced JavaScript">Advanced JavaScript</option>
                <option value="DOM & Browser APIs">DOM & Browser APIs</option>
                <option value="Python Fundamentals">Python Fundamentals</option>
                <option value="Advanced Python">Advanced Python</option>
                <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                <option value="React & Frontend Frameworks">React & Frontend Frameworks</option>
              </select>
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
