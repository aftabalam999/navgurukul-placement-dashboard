import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { Card, Button, Badge, LoadingSpinner, Alert, Modal } from '../../components/common/UIComponents';

const ProfileApprovals = () => {
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComments, setRejectComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingProfiles();
  }, []);

  const fetchPendingProfiles = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getPendingProfiles();
      setPendingProfiles(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId) => {
    try {
      setActionLoading(true);
      await userAPI.approveProfile(studentId);
      setSuccess('Profile approved successfully');
      setShowDetailsModal(false);
      fetchPendingProfiles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComments.trim()) {
      setError('Please provide comments for requesting changes');
      return;
    }
    
    try {
      setActionLoading(true);
      await userAPI.requestProfileChanges(selectedStudent._id, rejectComments);
      setSuccess('Changes requested successfully');
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setRejectComments('');
      fetchPendingProfiles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request changes');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailsModal = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const openRejectModal = () => {
    setShowRejectModal(true);
  };

  const getCEFRLabel = (level) => {
    const labels = {
      'A1': 'Beginner',
      'A2': 'Elementary',
      'B1': 'Intermediate',
      'B2': 'Upper Intermediate',
      'C1': 'Advanced',
      'C2': 'Proficient'
    };
    return labels[level] || level;
  };

  const getProficiencyColor = (proficiency) => {
    const colors = {
      beginner: 'bg-red-100 text-red-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-green-100 text-green-800',
      expert: 'bg-blue-100 text-blue-800'
    };
    return colors[proficiency] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve student profiles</p>
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

      {pendingProfiles.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Pending Profiles</h3>
            <p className="mt-1 text-gray-500">All student profiles have been reviewed.</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingProfiles.map((student) => (
            <Card key={student._id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">School:</span>
                  <span className="text-gray-900">{student.currentEducation?.school || 'Not set'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Module:</span>
                  <span className="text-gray-900">{student.currentEducation?.currentModule || 'Not set'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Location:</span>
                  <span className="text-gray-900">
                    {student.hometown?.district ? `${student.hometown.district}, ${student.hometown.state}` : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-24">Roles:</span>
                  <span className="text-gray-900">
                    {student.rolePreferences?.length > 0 
                      ? `${student.rolePreferences.slice(0, 2).join(', ')}${student.rolePreferences.length > 2 ? '...' : ''}`
                      : 'Not set'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => openDetailsModal(student)}
                >
                  View Details
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleApprove(student._id)}
                >
                  Approve
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedStudent && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${selectedStudent.firstName} ${selectedStudent.lastName}'s Profile`}
          size="xl"
        >
          <div className="max-h-[70vh] overflow-y-auto">
            {/* Personal Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Email</span>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone</span>
                  <p className="font-medium">{selectedStudent.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Date of Birth</span>
                  <p className="font-medium">
                    {selectedStudent.dateOfBirth 
                      ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() 
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Gender</span>
                  <p className="font-medium capitalize">{selectedStudent.gender || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Hometown */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Hometown</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Pincode</span>
                  <p className="font-medium">{selectedStudent.hometown?.pincode || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Village/Town</span>
                  <p className="font-medium">{selectedStudent.hometown?.village || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">District</span>
                  <p className="font-medium">{selectedStudent.hometown?.district || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">State</span>
                  <p className="font-medium">{selectedStudent.hometown?.state || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Current Education (Navgurukul) */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Current Education (Navgurukul)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">School</span>
                  <p className="font-medium">{selectedStudent.currentEducation?.school || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Specialization</span>
                  <p className="font-medium">{selectedStudent.currentEducation?.specialization || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Joining Date</span>
                  <p className="font-medium">
                    {selectedStudent.currentEducation?.joiningDate 
                      ? new Date(selectedStudent.currentEducation.joiningDate).toLocaleDateString() 
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Current Module</span>
                  <p className="font-medium">{selectedStudent.currentEducation?.currentModule || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Previous Education */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Previous Education</h3>
              
              {/* 10th Grade */}
              {selectedStudent.tenthGrade?.percentage && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">10th Grade</h4>
                  <div className="grid grid-cols-3 gap-4 pl-4">
                    <div>
                      <span className="text-sm text-gray-500">Percentage</span>
                      <p className="font-medium">{selectedStudent.tenthGrade.percentage}%</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Board</span>
                      <p className="font-medium">{selectedStudent.tenthGrade.board || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Year of Passing</span>
                      <p className="font-medium">{selectedStudent.tenthGrade.yearOfPassing || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 12th Grade */}
              {selectedStudent.twelfthGrade?.percentage && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">12th Grade</h4>
                  <div className="grid grid-cols-4 gap-4 pl-4">
                    <div>
                      <span className="text-sm text-gray-500">Percentage</span>
                      <p className="font-medium">{selectedStudent.twelfthGrade.percentage}%</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Board</span>
                      <p className="font-medium">{selectedStudent.twelfthGrade.board || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Stream</span>
                      <p className="font-medium">{selectedStudent.twelfthGrade.stream || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Year of Passing</span>
                      <p className="font-medium">{selectedStudent.twelfthGrade.yearOfPassing || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Degree */}
              {selectedStudent.degree?.name && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Higher Education</h4>
                  <div className="grid grid-cols-3 gap-4 pl-4">
                    <div>
                      <span className="text-sm text-gray-500">Degree</span>
                      <p className="font-medium">{selectedStudent.degree.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Institution</span>
                      <p className="font-medium">{selectedStudent.degree.institution || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Year</span>
                      <p className="font-medium">{selectedStudent.degree.yearOfCompletion || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Technical Skills */}
            {selectedStudent.technicalSkills?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Technical Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.technicalSkills.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${getProficiencyColor(skill.proficiency)}`}
                    >
                      {skill.name} ({skill.proficiency})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* English Proficiency */}
            {selectedStudent.englishProficiency && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">English Proficiency (CEFR)</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Reading</span>
                    <p className="font-medium">
                      {selectedStudent.englishProficiency.reading} - {getCEFRLabel(selectedStudent.englishProficiency.reading)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Writing</span>
                    <p className="font-medium">
                      {selectedStudent.englishProficiency.writing} - {getCEFRLabel(selectedStudent.englishProficiency.writing)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Speaking</span>
                    <p className="font-medium">
                      {selectedStudent.englishProficiency.speaking} - {getCEFRLabel(selectedStudent.englishProficiency.speaking)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Listening</span>
                    <p className="font-medium">
                      {selectedStudent.englishProficiency.listening} - {getCEFRLabel(selectedStudent.englishProficiency.listening)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Soft Skills */}
            {selectedStudent.softSkills?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Soft Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.softSkills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Role Preferences */}
            {selectedStudent.rolePreferences?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Role Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.rolePreferences.map((role, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {index + 1}. {role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Approval History */}
            {selectedStudent.approvalHistory?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Approval History</h3>
                <div className="space-y-3">
                  {selectedStudent.approvalHistory.map((history, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <Badge variant={history.status === 'approved' ? 'success' : history.status === 'changes_requested' ? 'warning' : 'default'}>
                          {history.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(history.reviewedAt).toLocaleString()}
                        </span>
                      </div>
                      {history.comments && (
                        <p className="mt-2 text-sm text-gray-600">{history.comments}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
            <Button
              variant="danger"
              onClick={openRejectModal}
              disabled={actionLoading}
            >
              Request Changes
            </Button>
            <Button
              variant="primary"
              onClick={() => handleApprove(selectedStudent._id)}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Approve Profile'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectComments('');
          }}
          title="Request Profile Changes"
          size="md"
        >
          <div>
            <p className="text-gray-600 mb-4">
              Please provide feedback on what changes the student needs to make to their profile.
            </p>
            <textarea
              value={rejectComments}
              onChange={(e) => setRejectComments(e.target.value)}
              placeholder="Enter your comments and feedback..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={5}
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectComments('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={actionLoading || !rejectComments.trim()}
              >
                {actionLoading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProfileApprovals;
