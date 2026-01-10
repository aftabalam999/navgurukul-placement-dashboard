import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jobReadinessAPI } from '../../services/api';
import { Card, Button, Badge, LoadingSpinner, Alert, Modal } from '../../components/common/UIComponents';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  DocumentArrowUpIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ChatBubbleBottomCenterTextIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const MODULE_ORDER = [
  'Foundation',
  'Basics of Programming', 
  'DSA',
  'Backend',
  'Full Stack',
  'Interview Prep'
];

const CATEGORY_ICONS = {
  'Module Completion': AcademicCapIcon,
  'Technical Skills': BriefcaseIcon,
  'Soft Skills': ChatBubbleBottomCenterTextIcon,
  'Profile Completion': DocumentArrowUpIcon,
  'Other': TrophyIcon
};

function JobReadiness() {
  const { user } = useAuth();
  const [readinessData, setReadinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [uploadModal, setUploadModal] = useState({ open: false, criterion: null });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchReadinessStatus();
  }, []);

  const fetchReadinessStatus = async () => {
    try {
      setLoading(true);
      const res = await jobReadinessAPI.getMyStatus();
      setReadinessData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job readiness status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCriterion = async (criterion, completed) => {
    // If marking complete and requires proof, show upload modal
    if (completed && criterion.requiresProof) {
      setUploadModal({ open: true, criterion });
      return;
    }

    try {
      setUpdating(criterion.criteriaId);
      await jobReadinessAPI.updateMyCriterion(criterion.criteriaId, { completed });
      await fetchReadinessStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update criterion');
    } finally {
      setUpdating(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const criterion = uploadModal.criterion;

    try {
      setUpdating(criterion.criteriaId);
      await jobReadinessAPI.updateMyCriterion(criterion.criteriaId, {
        completed: true,
        notes: formData.get('notes'),
        proofFile: formData.get('proofFile')
      });
      setUploadModal({ open: false, criterion: null });
      await fetchReadinessStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload proof');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (criterion) => {
    if (criterion.verificationStatus === 'verified') {
      return <Badge variant="success">Verified</Badge>;
    }
    if (criterion.verificationStatus === 'rejected') {
      return <Badge variant="danger">Rejected</Badge>;
    }
    if (criterion.verificationStatus === 'pending' && criterion.completed) {
      return <Badge variant="warning">Pending Review</Badge>;
    }
    if (criterion.completed) {
      return <Badge variant="info">Self-Marked</Badge>;
    }
    return <Badge variant="secondary">Not Started</Badge>;
  };

  const groupCriteriaByCategory = (criteria) => {
    const grouped = {};
    criteria.forEach(c => {
      const category = c.category || 'Other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(c);
    });
    return grouped;
  };

  const calculateProgress = () => {
    if (!readinessData?.progress?.criteria) return { completed: 0, total: 0, percentage: 0 };
    const criteria = readinessData.progress.criteria;
    const completed = criteria.filter(c => c.verificationStatus === 'verified').length;
    const total = criteria.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && !readinessData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert type="error">{error}</Alert>
        <p className="mt-4 text-gray-600">
          Job readiness criteria may not be configured for your school yet. Please contact your Campus PoC.
        </p>
      </div>
    );
  }

  const progress = calculateProgress();
  const groupedCriteria = groupCriteriaByCategory(readinessData?.progress?.criteria || []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Job Readiness Checklist</h1>
        <p className="mt-2 text-gray-600">
          Complete all criteria to become "Job Ready" and unlock more placement opportunities.
        </p>
      </div>

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {/* Progress Overview */}
      <Card className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
            <p className="text-gray-600 mt-1">
              {progress.completed} of {progress.total} criteria verified
            </p>
          </div>
          <div className="text-right">
            {readinessData?.progress?.isJobReady ? (
              <div className="flex items-center text-green-600">
                <TrophyIcon className="w-8 h-8 mr-2" />
                <span className="text-xl font-bold">Job Ready!</span>
              </div>
            ) : (
              <div className="text-3xl font-bold text-indigo-600">{progress.percentage}%</div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              readinessData?.progress?.isJobReady ? 'bg-green-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {readinessData?.progress?.isJobReady && readinessData?.progress?.jobReadyApprovedAt && (
          <p className="mt-3 text-sm text-green-600">
            ✓ Approved as Job Ready on {new Date(readinessData.progress.jobReadyApprovedAt).toLocaleDateString()}
          </p>
        )}
      </Card>

      {/* Criteria by Category */}
      {Object.entries(groupedCriteria).map(([category, criteria]) => {
        const CategoryIcon = CATEGORY_ICONS[category] || TrophyIcon;
        const categoryComplete = criteria.filter(c => c.verificationStatus === 'verified').length;
        
        return (
          <Card key={category} className="mb-6">
            <div className="flex items-center mb-4">
              <CategoryIcon className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              <span className="ml-auto text-sm text-gray-500">
                {categoryComplete}/{criteria.length} complete
              </span>
            </div>

            <div className="space-y-4">
              {criteria.map((criterion) => (
                <div 
                  key={criterion.criteriaId}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    criterion.verificationStatus === 'verified'
                      ? 'border-green-200 bg-green-50'
                      : criterion.completed
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <button
                        onClick={() => handleToggleCriterion(criterion, !criterion.completed)}
                        disabled={updating === criterion.criteriaId || criterion.verificationStatus === 'verified'}
                        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                          criterion.verificationStatus === 'verified'
                            ? 'border-green-500 bg-green-500 cursor-default'
                            : criterion.completed
                            ? 'border-yellow-500 bg-yellow-500 cursor-pointer hover:bg-yellow-600'
                            : 'border-gray-300 cursor-pointer hover:border-indigo-500'
                        }`}
                      >
                        {(criterion.completed || criterion.verificationStatus === 'verified') && (
                          <CheckIcon className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${
                            criterion.verificationStatus === 'verified' ? 'text-green-800' : 'text-gray-900'
                          }`}>
                            {criterion.name}
                          </h4>
                          {getStatusBadge(criterion)}
                        </div>
                        {criterion.description && (
                          <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                        )}
                        {criterion.requiresProof && !criterion.completed && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center">
                            <DocumentArrowUpIcon className="w-4 h-4 mr-1" />
                            Requires proof upload
                          </p>
                        )}
                        {criterion.proofUrl && (
                          <a 
                            href={criterion.proofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 mt-1 inline-block hover:underline"
                          >
                            View uploaded proof →
                          </a>
                        )}
                        {criterion.verificationStatus === 'rejected' && criterion.verificationNotes && (
                          <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                            <strong>Feedback:</strong> {criterion.verificationNotes}
                          </p>
                        )}
                        {criterion.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            <em>Your notes:</em> {criterion.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {updating === criterion.criteriaId && (
                      <LoadingSpinner size="small" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Legend */}
      <Card className="mt-8 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-3">Status Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-gray-300 mr-2" />
            <span>Not Started</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2" />
            <span>Self-Marked / Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2" />
            <span>Verified</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-500 mr-2" />
            <span>Rejected</span>
          </div>
        </div>
      </Card>

      {/* Upload Proof Modal */}
      <Modal
        isOpen={uploadModal.open}
        onClose={() => setUploadModal({ open: false, criterion: null })}
        title={`Upload Proof: ${uploadModal.criterion?.name || ''}`}
      >
        <form onSubmit={handleUploadSubmit}>
          <p className="text-sm text-gray-600 mb-4">
            {uploadModal.criterion?.description}
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proof Document (PDF, Image, or Document)
            </label>
            <input
              type="file"
              name="proofFile"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add any relevant notes about this submission..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUploadModal({ open: false, criterion: null })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updating}
            >
              {updating ? 'Uploading...' : 'Submit for Review'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default JobReadiness;
