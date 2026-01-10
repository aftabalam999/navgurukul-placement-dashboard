import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI, applicationAPI } from '../../services/api';
import { LoadingSpinner, StatusBadge } from '../../components/common/UIComponents';
import { 
  ArrowLeft, User, Mail, Phone, GraduationCap, Linkedin, 
  Github, Globe, FileText, Star, CheckCircle, XCircle, Clock 
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const POCStudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [recommendReason, setRecommendReason] = useState('');
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      const [studentRes, appsRes] = await Promise.all([
        userAPI.getStudent(id),
        applicationAPI.getApplications({ student: id })
      ]);
      setStudent(studentRes.data);
      setApplications(appsRes.data.applications);
    } catch (error) {
      toast.error('Error loading student data');
      navigate('/campus-poc/students');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillApproval = async (skillId, status) => {
    setProcessing(prev => ({ ...prev, [skillId]: true }));
    try {
      await userAPI.approveSkill(id, skillId, status);
      toast.success(`Skill ${status}`);
      fetchStudentData();
    } catch (error) {
      toast.error('Error processing skill');
    } finally {
      setProcessing(prev => ({ ...prev, [skillId]: false }));
    }
  };

  const handleRecommend = async () => {
    if (!selectedApplication || !recommendReason.trim()) return;
    
    try {
      await applicationAPI.addRecommendation(selectedApplication._id, recommendReason);
      toast.success('Recommendation added successfully');
      setShowRecommendModal(false);
      setSelectedApplication(null);
      setRecommendReason('');
      fetchStudentData();
    } catch (error) {
      toast.error('Error adding recommendation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!student) return null;

  const profile = student.studentProfile || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => navigate('/campus-poc/students')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* Header Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-primary-700 text-2xl font-bold">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                {student.email}
              </div>
              {student.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  {student.phone}
                </div>
              )}
              {profile.currentSchool && (
                <div className="flex items-center gap-2 text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  {profile.currentSchool}
                </div>
              )}
              {profile.currentModule && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  Module: {profile.currentModule}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              {profile.linkedIn && (
                <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-primary-600">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-gray-900">
                  <Github className="w-5 h-5" />
                </a>
              )}
              {profile.portfolio && (
                <a href={profile.portfolio} target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-primary-600">
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary-600">{profile.cgpa || '-'}</p>
            <p className="text-sm text-gray-500">CGPA</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Skills</h2>
            {profile.skills?.length > 0 ? (
              <div className="space-y-3">
                {profile.skills.map((skillItem) => (
                  <div 
                    key={skillItem.skill?._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {skillItem.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {skillItem.status === 'rejected' && <XCircle className="w-5 h-5 text-red-500" />}
                      {skillItem.status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                      <div>
                        <p className="font-medium">{skillItem.skill?.name}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {skillItem.skill?.category?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    {skillItem.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSkillApproval(skillItem.skill?._id, 'rejected')}
                          disabled={processing[skillItem.skill?._id]}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleSkillApproval(skillItem.skill?._id, 'approved')}
                          disabled={processing[skillItem.skill?._id]}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <StatusBadge status={skillItem.status} />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills added</p>
            )}
          </div>
        </div>

        {/* About & Resume */}
        <div className="space-y-6">
          {profile.about && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">About</h2>
              <p className="text-gray-600 text-sm">{profile.about}</p>
            </div>
          )}
          {profile.resume && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Resume</h2>
              <a 
                href={`/${profile.resume}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 hover:underline"
              >
                <FileText className="w-5 h-5" />
                View Resume
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Applications */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Applications ({applications.length})</h2>
        {applications.length > 0 ? (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{app.job?.title}</p>
                  <p className="text-sm text-gray-500">{app.job?.company?.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Applied: {format(new Date(app.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={app.status} />
                  {!app.specialRecommendation?.isRecommended && 
                   ['applied', 'shortlisted', 'in_progress'].includes(app.status) && (
                    <button
                      onClick={() => {
                        setSelectedApplication(app);
                        setShowRecommendModal(true);
                      }}
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                    >
                      <Star className="w-4 h-4" />
                      Recommend
                    </button>
                  )}
                  {app.specialRecommendation?.isRecommended && (
                    <span className="flex items-center gap-1 text-sm text-purple-600">
                      <Star className="w-4 h-4 fill-current" />
                      Recommended
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No applications yet</p>
        )}
      </div>

      {/* Recommendation Modal */}
      {showRecommendModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold mb-2">Add Special Recommendation</h3>
            <p className="text-gray-600 text-sm mb-4">
              Recommend {student.firstName} for {selectedApplication.job?.title} at {selectedApplication.job?.company?.name}
            </p>
            <textarea
              rows={4}
              value={recommendReason}
              onChange={(e) => setRecommendReason(e.target.value)}
              placeholder="Why do you recommend this student for this role?"
              className="w-full mb-4"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowRecommendModal(false);
                  setSelectedApplication(null);
                  setRecommendReason('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleRecommend}
                disabled={!recommendReason.trim()}
                className="btn btn-primary"
              >
                Submit Recommendation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POCStudentDetails;
