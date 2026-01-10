import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// User APIs
export const userAPI = {
  getStudents: (params) => api.get('/users/students', { params }),
  getStudent: (id) => api.get(`/users/students/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  submitProfile: () => api.post('/users/profile/submit'),
  addSkill: (skillId) => api.post('/users/profile/skills', { skillId }),
  approveSkill: (studentId, skillId, status) => 
    api.put(`/users/students/${studentId}/skills/${skillId}`, { status }),
  getPendingSkills: () => api.get('/users/pending-skills'),
  getPendingProfiles: () => api.get('/users/pending-profiles'),
  approveProfile: (studentId, status, revisionNotes) =>
    api.put(`/users/students/${studentId}/profile/approve`, { status, revisionNotes }),
  updateStudentProfile: (studentId, data) =>
    api.put(`/users/students/${studentId}/profile`, data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.put('/users/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Settings APIs
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  getSetting: (key) => api.get(`/settings/${key}`),
  updateSetting: (key, value) => api.put(`/settings/${key}`, { value }),
  addItem: (key, item) => api.post(`/settings/${key}/add`, { item }),
  removeItem: (key, item) => api.post(`/settings/${key}/remove`, { item }),
  initSettings: () => api.post('/settings/init'),
  addCourseSkill: (skill) => api.post('/settings/course-skills', { skill })
};

// Job APIs
export const jobAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getMatchingJobs: () => api.get('/jobs/matching'),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`)
};

// Application APIs
export const applicationAPI = {
  getApplications: (params) => api.get('/applications', { params }),
  getApplication: (id) => api.get(`/applications/${id}`),
  apply: (jobId, coverLetter) => api.post('/applications', { jobId, coverLetter }),
  updateStatus: (id, status, feedback) => 
    api.put(`/applications/${id}/status`, { status, feedback }),
  updateRound: (id, roundData) => api.put(`/applications/${id}/rounds`, roundData),
  addRecommendation: (id, reason) => api.put(`/applications/${id}/recommend`, { reason }),
  withdraw: (id) => api.put(`/applications/${id}/withdraw`),
  exportCSV: (params) => api.get('/applications/export/csv', { params, responseType: 'blob' })
};

// Skill APIs
export const skillAPI = {
  getSkills: (params) => api.get('/skills', { params }),
  getCategories: () => api.get('/skills/categories'),
  getSkill: (id) => api.get(`/skills/${id}`),
  createSkill: (data) => api.post('/skills', data),
  updateSkill: (id, data) => api.put(`/skills/${id}`, data),
  deleteSkill: (id) => api.delete(`/skills/${id}`)
};

// Notification APIs
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/clear/read')
};

// Stats APIs
export const statsAPI = {
  getDashboard: (params) => api.get('/stats/dashboard', { params }),
  getCampusStats: () => api.get('/stats/campus'),
  getStudentStats: () => api.get('/stats/student'),
  getCampusPocStats: () => api.get('/stats/campus-poc'),
  getCompanyTracking: (cycleId) => api.get('/stats/campus-poc/company-tracking', { params: { cycleId } }),
  getSchoolTracking: (cycleId) => api.get('/stats/campus-poc/school-tracking', { params: { cycleId } }),
  getStudentSummary: (params) => api.get('/stats/campus-poc/student-summary', { params }),
  getCycleStats: () => api.get('/stats/campus-poc/cycle-stats'),
  exportStats: (params) => api.get('/stats/export', { params, responseType: 'blob' })
};

// Placement Cycle APIs
export const placementCycleAPI = {
  getCycles: (params) => api.get('/placement-cycles', { params }),
  createCycle: (data) => api.post('/placement-cycles', data),
  updateCycle: (id, data) => api.put(`/placement-cycles/${id}`, data),
  deleteCycle: (id) => api.delete(`/placement-cycles/${id}`),
  getCycleStudents: (cycleId, params) => api.get(`/placement-cycles/${cycleId}/students`, { params }),
  assignStudents: (cycleId, studentIds) => api.post(`/placement-cycles/${cycleId}/students`, { studentIds }),
  removeStudents: (cycleId, studentIds) => api.delete(`/placement-cycles/${cycleId}/students`, { data: { studentIds } }),
  getUnassignedStudents: (params) => api.get('/placement-cycles/unassigned/students', { params }),
  updateMyCycle: (cycleId) => api.put('/placement-cycles/my-cycle', { cycleId }),
  updateStudentCycleOnPlacement: (studentId) => api.put(`/placement-cycles/student/${studentId}/placement-success`)
};

// Campus APIs
export const campusAPI = {
  getCampuses: () => api.get('/campuses'),
  getCampus: (id) => api.get(`/campuses/${id}`),
  createCampus: (data) => api.post('/campuses', data),
  updateCampus: (id, data) => api.put(`/campuses/${id}`, data),
  deleteCampus: (id) => api.delete(`/campuses/${id}`)
};

export default api;
