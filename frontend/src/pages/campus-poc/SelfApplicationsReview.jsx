import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { selfApplicationAPI } from '../../services/api';
import { Card, Button, Badge, LoadingSpinner, Alert, Modal } from '../../components/common/UIComponents';
import { BulkUploadModal } from '../../components/common/BulkUpload';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'interview_scheduled', label: 'Interview Scheduled', color: 'bg-purple-100 text-purple-800' },
  { value: 'offer_received', label: 'Offer Received', color: 'bg-green-100 text-green-800' },
  { value: 'offer_accepted', label: 'Offer Accepted', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'offer_declined', label: 'Offer Declined', color: 'bg-orange-100 text-orange-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' }
];

function SelfApplicationsReview() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ status: 'all', verified: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [verifyModal, setVerifyModal] = useState({ open: false, application: null });
  const [bulkUploadModal, setBulkUploadModal] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, application: null });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, statsRes] = await Promise.all([
        selfApplicationAPI.getCampusApplications({ all: true }),
        selfApplicationAPI.getCampusStats()
      ]);
      setApplications(appsRes.data);
      setStats(statsRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (verified) => {
    try {
      setProcessing(true);
      await selfApplicationAPI.verify(verifyModal.application._id, {
        verified,
        notes: document.getElementById('verificationNotes')?.value || ''
      });
      setVerifyModal({ open: false, application: null });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify application');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusObj = STATUS_OPTIONS.find(s => s.value === status);
    return statusObj ? (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusObj.color}`}>
        {statusObj.label}
      </span>
    ) : (
      <Badge variant="secondary">{status}</Badge>
    );
  };

  const filteredApplications = applications.filter(app => {
    // Status filter
    if (filter.status !== 'all' && app.status !== filter.status) return false;
    
    // Verification filter
    if (filter.verified === 'verified' && !app.verified) return false;
    if (filter.verified === 'unverified' && app.verified) return false;
    if (filter.verified === 'pending' && app.verified !== undefined) return false;
    
    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        app.student?.name?.toLowerCase().includes(search) ||
        app.companyName?.toLowerCase().includes(search) ||
        app.jobTitle?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  // Group by student
  const groupedByStudent = filteredApplications.reduce((acc, app) => {
    const studentId = app.student?._id || 'unknown';
    if (!acc[studentId]) {
      acc[studentId] = {
        student: app.student,
        applications: []
      };
    }
    acc[studentId].applications.push(app);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Self Applications Review</h1>
          <p className="mt-2 text-gray-600">
            Review and verify student self-reported job applications.
          </p>
        </div>
        <Button onClick={() => setBulkUploadModal(true)}>
          <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
          Bulk Upload
        </Button>
      </div>

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Applications</div>
          </Card>
          <Card className="text-center bg-blue-50">
            <div className="text-3xl font-bold text-blue-600">{stats.active}</div>
            <div className="text-sm text-gray-500">Active</div>
          </Card>
          <Card className="text-center bg-green-50">
            <div className="text-3xl font-bold text-green-600">{stats.offers}</div>
            <div className="text-sm text-gray-500">Offers</div>
          </Card>
          <Card className="text-center bg-emerald-50">
            <div className="text-3xl font-bold text-emerald-600">{stats.placed}</div>
            <div className="text-sm text-gray-500">Placed</div>
          </Card>
          <Card className="text-center bg-yellow-50">
            <div className="text-3xl font-bold text-yellow-600">{stats.unverified}</div>
            <div className="text-sm text-gray-500">Unverified</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <select
            value={filter.verified}
            onChange={(e) => setFilter(prev => ({ ...prev, verified: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Verification</option>
            <option value="pending">Pending Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Rejected</option>
          </select>
        </div>

        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student, company, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Applications by Student */}
      {Object.keys(groupedByStudent).length === 0 ? (
        <Card className="text-center py-12">
          <BuildingOfficeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-500">
            No self-applications match your current filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByStudent).map(({ student, applications: studentApps }) => (
            <Card key={student?._id || 'unknown'}>
              {/* Student Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                    {student?.avatar ? (
                      <img src={student.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student?.name || 'Unknown Student'}</h3>
                    <p className="text-sm text-gray-500">{student?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-indigo-600">{studentApps.length}</div>
                  <div className="text-xs text-gray-500">Applications</div>
                </div>
              </div>

              {/* Student's Applications */}
              <div className="mt-4 space-y-3">
                {studentApps.map(app => (
                  <div 
                    key={app._id}
                    className={`p-4 rounded-lg border ${
                      app.verified === true 
                        ? 'border-green-200 bg-green-50' 
                        : app.verified === false
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{app.jobTitle}</h4>
                          {getStatusBadge(app.status)}
                          {app.verified === true && (
                            <Badge variant="success">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {app.verified === false && (
                            <Badge variant="danger">
                              <XCircleIcon className="w-3 h-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                          {app.companyName}
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {app.location && (
                            <span className="flex items-center">
                              <MapPinIcon className="w-3 h-3 mr-1" />
                              {app.location}
                            </span>
                          )}
                          {app.salary && (
                            <span className="flex items-center">
                              <CurrencyRupeeIcon className="w-3 h-3 mr-1" />
                              {app.salary}
                            </span>
                          )}
                          <span className="flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {new Date(app.applicationDate).toLocaleDateString()}
                          </span>
                          {app.source && (
                            <span>via {app.source}</span>
                          )}
                        </div>

                        {app.jobUrl && (
                          <a 
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline mt-2 inline-flex items-center"
                          >
                            <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
                            View Job Posting
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setDetailModal({ open: true, application: app })}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="View Details"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        
                        {app.verified === undefined && (
                          <Button
                            size="small"
                            onClick={() => setVerifyModal({ open: true, application: app })}
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Interview Rounds */}
                    {app.interviewRounds?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-700 mb-2">Interview Progress</div>
                        <div className="flex flex-wrap gap-2">
                          {app.interviewRounds.map((round, idx) => (
                            <span 
                              key={idx}
                              className={`px-2 py-1 text-xs rounded ${
                                round.result === 'passed' ? 'bg-green-100 text-green-800' :
                                round.result === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {round.name || `Round ${idx + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verification Notes */}
                    {app.verificationNotes && (
                      <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded">
                        <strong>Verification Notes:</strong> {app.verificationNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Verify Modal */}
      <Modal
        isOpen={verifyModal.open}
        onClose={() => setVerifyModal({ open: false, application: null })}
        title="Verify Application"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Student:</strong> {verifyModal.application?.student?.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Company:</strong> {verifyModal.application?.companyName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Position:</strong> {verifyModal.application?.jobTitle}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Status:</strong> {verifyModal.application?.status}
            </p>
          </div>

          {verifyModal.application?.jobUrl && (
            <a 
              href={verifyModal.application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline flex items-center text-sm"
            >
              <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-1" />
              View Job Posting
            </a>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Notes
            </label>
            <textarea
              id="verificationNotes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add notes about your verification..."
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => handleVerify(false)}
              disabled={processing}
            >
              <XMarkIcon className="w-5 h-5 mr-1" />
              Reject
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleVerify(true)}
              disabled={processing}
            >
              <CheckIcon className="w-5 h-5 mr-1" />
              Verify
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, application: null })}
        title="Application Details"
        size="large"
      >
        {detailModal.application && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Company</label>
                <p className="font-medium text-gray-900">{detailModal.application.companyName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Position</label>
                <p className="font-medium text-gray-900">{detailModal.application.jobTitle}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Location</label>
                <p className="text-gray-900">{detailModal.application.location || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Salary</label>
                <p className="text-gray-900">{detailModal.application.salary || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Applied On</label>
                <p className="text-gray-900">
                  {new Date(detailModal.application.applicationDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Source</label>
                <p className="text-gray-900">{detailModal.application.source || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Status</label>
                <p>{getStatusBadge(detailModal.application.status)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Verified</label>
                <p>
                  {detailModal.application.verified === true ? (
                    <Badge variant="success">Yes</Badge>
                  ) : detailModal.application.verified === false ? (
                    <Badge variant="danger">Rejected</Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </p>
              </div>
            </div>

            {detailModal.application.notes && (
              <div>
                <label className="text-xs font-medium text-gray-500">Student Notes</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded mt-1">
                  {detailModal.application.notes}
                </p>
              </div>
            )}

            {detailModal.application.interviewRounds?.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500">Interview Rounds</label>
                <div className="mt-2 space-y-2">
                  {detailModal.application.interviewRounds.map((round, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{round.name || `Round ${idx + 1}`}</span>
                        {round.date && (
                          <span className="text-sm text-gray-500 ml-2">
                            {new Date(round.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        round.result === 'passed' ? 'bg-green-100 text-green-800' :
                        round.result === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {round.result || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailModal.application.statusHistory?.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500">Status History</label>
                <div className="mt-2 space-y-1">
                  {detailModal.application.statusHistory.map((history, idx) => (
                    <div key={idx} className="text-sm text-gray-600">
                      <span className="font-medium">{history.status}</span>
                      <span className="text-gray-400 mx-2">•</span>
                      <span>{new Date(history.changedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={bulkUploadModal}
        onClose={() => setBulkUploadModal(false)}
        type="selfApplicationsCampus"
        onSuccess={() => {
          fetchData();
          setBulkUploadModal(false);
        }}
      />
    </div>
  );
}

export default SelfApplicationsReview;
