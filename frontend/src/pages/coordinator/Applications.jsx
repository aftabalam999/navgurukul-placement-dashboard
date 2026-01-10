import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationAPI, jobAPI } from '../../services/api';
import { LoadingSpinner, StatusBadge, Pagination, EmptyState, Modal } from '../../components/common/UIComponents';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, MessageSquare, Download, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const Applications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    job: '',
    search: ''
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, [filters.status, filters.job, pagination.page]);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getJobs({ limit: 100 });
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.job && { job: filters.job })
      };
      const response = await applicationAPI.getApplications(params);
      setApplications(response.data.applications || []);
      setPagination({
        page: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      toast.error('Error fetching applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status, withFeedback = false) => {
    if (!selectedApplication) return;

    try {
      await applicationAPI.updateStatus(selectedApplication._id, {
        status,
        ...(withFeedback && { coordinatorFeedback: feedback })
      });
      toast.success(`Application ${status}`);
      setShowDetailModal(false);
      setShowFeedbackModal(false);
      setFeedback('');
      fetchApplications();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const openFeedbackModal = (status) => {
    setNewStatus(status);
    setShowDetailModal(false);
    setShowFeedbackModal(true);
  };

  const filteredApplications = applications.filter(app => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      app.student?.name?.toLowerCase().includes(searchLower) ||
      app.student?.email?.toLowerCase().includes(searchLower) ||
      app.job?.title?.toLowerCase().includes(searchLower) ||
      app.job?.company?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'under_review': return <Eye className="w-4 h-4" />;
      case 'shortlisted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'selected': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'withdrawn', label: 'Withdrawn' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">Manage and review student applications</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{pagination.total} total applications</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, email, or job..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10 w-full"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="md:w-48"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={filters.job}
            onChange={(e) => setFilters({ ...filters, job: e.target.value })}
            className="md:w-64"
          >
            <option value="">All Jobs</option>
            {jobs.map(job => (
              <option key={job._id} value={job._id}>
                {job.title} - {job.company?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No applications found"
            description="No applications match your current filters"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Job</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Applied On</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Current Round</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredApplications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{app.student?.name}</p>
                        <p className="text-sm text-gray-500">{app.student?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{app.job?.title}</p>
                        <p className="text-sm text-gray-500">{app.job?.company?.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {app.currentRound !== undefined ? `Round ${app.currentRound + 1}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.student?.profile?.resume && (
                          <a
                            href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${app.student.profile.resume}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Download Resume"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setPagination({ ...pagination, page })}
        />
      )}

      {/* Application Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Application Details"
        size="lg"
      >
        {selectedApplication && (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{selectedApplication.student?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{selectedApplication.student?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">School</p>
                  <p className="font-medium">{selectedApplication.student?.profile?.currentSchool || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Module</p>
                  <p className="font-medium">{selectedApplication.student?.profile?.currentModule || '-'}</p>
                </div>
              </div>
            </div>

            {/* Job Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Job Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Position</p>
                  <p className="font-medium">{selectedApplication.job?.title}</p>
                </div>
                <div>
                  <p className="text-gray-500">Company</p>
                  <p className="font-medium">{selectedApplication.job?.company?.name}</p>
                </div>
              </div>
            </div>

            {/* Application Status */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Current Status</h3>
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedApplication.status)}
                <StatusBadge status={selectedApplication.status} />
                <span className="text-sm text-gray-500">
                  Applied on {new Date(selectedApplication.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Cover Letter */}
            {selectedApplication.coverLetter && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cover Letter</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {selectedApplication.coverLetter}
                </p>
              </div>
            )}

            {/* POC Recommendation */}
            {selectedApplication.pocRecommendation?.recommended && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">POC Recommendation</h3>
                <p className="text-sm text-green-700">{selectedApplication.pocRecommendation.comments}</p>
              </div>
            )}

            {/* Previous Feedback */}
            {selectedApplication.coordinatorFeedback && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Previous Feedback</h3>
                <p className="text-sm text-blue-700">{selectedApplication.coordinatorFeedback}</p>
              </div>
            )}

            {/* Interview Rounds Progress */}
            {selectedApplication.interviewRounds?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Interview Progress</h3>
                <div className="space-y-2">
                  {selectedApplication.interviewRounds.map((round, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        round.status === 'passed' ? 'bg-green-50' :
                        round.status === 'failed' ? 'bg-red-50' :
                        round.status === 'scheduled' ? 'bg-yellow-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        round.status === 'passed' ? 'bg-green-500 text-white' :
                        round.status === 'failed' ? 'bg-red-500 text-white' :
                        round.status === 'scheduled' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{round.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{round.type?.replace('_', ' ')}</p>
                      </div>
                      <span className="text-xs capitalize">{round.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!['selected', 'rejected', 'withdrawn'].includes(selectedApplication.status) && (
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {selectedApplication.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('under_review')}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Mark Under Review
                  </button>
                )}
                {['pending', 'under_review'].includes(selectedApplication.status) && (
                  <>
                    <button
                      onClick={() => openFeedbackModal('shortlisted')}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Shortlist
                    </button>
                    <button
                      onClick={() => openFeedbackModal('rejected')}
                      className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                {selectedApplication.status === 'shortlisted' && (
                  <button
                    onClick={() => handleStatusUpdate('interviewing')}
                    className="btn btn-primary"
                  >
                    Move to Interview
                  </button>
                )}
                {selectedApplication.status === 'interviewing' && (
                  <>
                    <button
                      onClick={() => openFeedbackModal('selected')}
                      className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Select
                    </button>
                    <button
                      onClick={() => openFeedbackModal('rejected')}
                      className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setFeedback('');
        }}
        title={`${newStatus === 'rejected' ? 'Rejection' : 'Status Update'} Feedback`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Add feedback for the student regarding this decision (optional but recommended).
          </p>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Enter feedback for the student..."
            className="w-full"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowFeedbackModal(false);
                setFeedback('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => handleStatusUpdate(newStatus, true)}
              className={`btn ${newStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'} text-white`}
            >
              Confirm {newStatus === 'rejected' ? 'Rejection' : newStatus}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Applications;
