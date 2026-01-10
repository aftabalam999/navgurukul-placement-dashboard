import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobAPI, applicationAPI, authAPI } from '../../services/api';
import { LoadingSpinner, StatusBadge } from '../../components/common/UIComponents';
import { 
  ArrowLeft, Briefcase, MapPin, DollarSign, Calendar, Clock, 
  Users, Building, Globe, CheckCircle, AlertCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [profileStatus, setProfileStatus] = useState('draft');
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    fetchJob();
    checkIfApplied();
    fetchProfileStatus();
  }, [id]);

  const fetchProfileStatus = async () => {
    try {
      const response = await authAPI.getMe();
      setProfileStatus(response.data?.studentProfile?.profileStatus || 'draft');
    } catch (error) {
      console.error('Error fetching profile status:', error);
    }
  };

  const fetchJob = async () => {
    try {
      const response = await jobAPI.getJob(id);
      setJob(response.data);
    } catch (error) {
      toast.error('Error loading job details');
      navigate('/student/jobs');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const response = await applicationAPI.getApplications({ job: id });
      setHasApplied(response.data.applications.length > 0);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await applicationAPI.apply(id, coverLetter);
      toast.success('Application submitted successfully!');
      setHasApplied(true);
      setShowApplyModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting application');
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (salary) => {
    if (!salary?.min && !salary?.max) return 'Not disclosed';
    const format = (num) => (num / 100000).toFixed(1) + ' LPA';
    if (salary.min && salary.max) return `${format(salary.min)} - ${format(salary.max)}`;
    if (salary.min) return `${format(salary.min)}+`;
    return `Up to ${format(salary.max)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!job) return null;

  const isDeadlinePassed = new Date(job.applicationDeadline) < new Date();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => navigate('/student/jobs')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-lg text-gray-600">{job.company?.name}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatSalary(job.salary)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {job.maxPositions} positions
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={job.status} />
            <StatusBadge status={job.jobType} />
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-6 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Application Deadline: {format(new Date(job.applicationDeadline), 'MMMM dd, yyyy')}</span>
            {isDeadlinePassed && (
              <span className="text-red-500 text-sm">(Passed)</span>
            )}
          </div>

          {hasApplied ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>Already Applied</span>
            </div>
          ) : isDeadlinePassed ? (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span>Applications Closed</span>
            </div>
          ) : profileStatus !== 'approved' ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-5 h-5" />
                <span>Profile Approval Required</span>
              </div>
              <Link to="/student/profile" className="text-sm text-primary-600 hover:underline">
                Complete your profile →
              </Link>
            </div>
          ) : (
            <button
              onClick={() => setShowApplyModal(true)}
              className="btn btn-primary"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Job Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Responsibilities</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-600">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 shrink-0" />
                    {resp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interview Rounds */}
          {job.interviewRounds?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Interview Process</h2>
              <div className="space-y-3">
                {job.interviewRounds.map((round, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{round.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{round.type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Required Skills */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Required Skills</h2>
            <div className="space-y-2">
              {job.requiredSkills?.map((s) => (
                <div 
                  key={s.skill?._id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    s.required ? 'bg-primary-50' : 'bg-gray-50'
                  }`}
                >
                  <span className="text-sm">{s.skill?.name}</span>
                  {s.required && (
                    <span className="text-xs text-primary-600 font-medium">Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Eligibility */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Eligibility Criteria</h2>
            <div className="space-y-3 text-sm">
              {job.eligibility?.minCgpa && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Minimum CGPA</span>
                  <span className="font-medium">{job.eligibility.minCgpa}</span>
                </div>
              )}
              {job.eligibility?.schools?.length > 0 && (
                <div>
                  <span className="text-gray-500 block mb-1">Schools</span>
                  <div className="flex flex-wrap gap-1">
                    {job.eligibility.schools.map((school, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {school}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {job.eligibility?.campuses?.length > 0 && (
                <div>
                  <span className="text-gray-500 block mb-1">Campuses</span>
                  <div className="flex flex-wrap gap-1">
                    {job.eligibility.campuses.map((campus, i) => (
                      <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {campus.name || campus}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {job.eligibility?.minModule && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Minimum Module</span>
                  <span className="font-medium">{job.eligibility.minModule}</span>
                </div>
              )}
              {(!job.eligibility?.schools?.length && 
                !job.eligibility?.campuses?.length && 
                !job.eligibility?.minCgpa &&
                !job.eligibility?.minModule) && (
                <p className="text-green-600 font-medium">Open for all students</p>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">About Company</h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium">{job.company?.name}</p>
                {job.company?.website && (
                  <a 
                    href={job.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <Globe className="w-3 h-3" />
                    Website
                  </a>
                )}
              </div>
            </div>
            {job.company?.description && (
              <p className="text-sm text-gray-600">{job.company.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 animate-fadeIn">
            <h3 className="text-lg font-semibold mb-4">Apply for {job.title}</h3>
            <p className="text-gray-600 mb-4">
              Your profile and resume will be shared with the recruiter.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Letter (Optional)
              </label>
              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're a good fit for this role..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowApplyModal(false)} 
                className="btn btn-secondary"
                disabled={applying}
              >
                Cancel
              </button>
              <button 
                onClick={handleApply} 
                className="btn btn-primary"
                disabled={applying}
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;
