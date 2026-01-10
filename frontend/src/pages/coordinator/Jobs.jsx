import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobAPI, settingsAPI } from '../../services/api';
import { LoadingSpinner, StatusBadge, Pagination, EmptyState, ConfirmModal } from '../../components/common/UIComponents';
import { Briefcase, Plus, Search, Edit, Trash2, MapPin, Calendar, Users, GraduationCap, Clock, LayoutGrid, List } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import JobsKanban from './JobsKanban';

const CoordinatorJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', status: '', jobType: '' });
  const [deleteModal, setDeleteModal] = useState({ show: false, jobId: null });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('jobsViewMode') || 'list';
  });
  const [pipelineStages, setPipelineStages] = useState([]);

  useEffect(() => {
    fetchPipelineStages();
  }, []);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchJobs();
    }
  }, [pagination.current, filters, viewMode]);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('jobsViewMode', viewMode);
  }, [viewMode]);

  const fetchPipelineStages = async () => {
    try {
      const response = await settingsAPI.getPipelineStages();
      setPipelineStages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobAPI.getJobs({
        page: pagination.current,
        limit: 10,
        search: filters.search || undefined,
        status: filters.status || undefined,
        jobType: filters.jobType || undefined
      });
      setJobs(response.data.jobs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.jobId) return;
    
    try {
      await jobAPI.deleteJob(deleteModal.jobId);
      toast.success('Job deleted successfully');
      setDeleteModal({ show: false, jobId: null });
      fetchJobs();
    } catch (error) {
      toast.error('Error deleting job');
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await jobAPI.updateJob(jobId, { status: newStatus });
      toast.success('Job status updated');
      fetchJobs();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
          <p className="text-gray-600">Create and manage job postings</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
          </div>
          <Link to="/coordinator/jobs/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Job
          </Link>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <JobsKanban />
      ) : (
        <>
          {/* Filters */}
          <div className="card">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                className="w-full md:w-40"
              >
                <option value="">All Types</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full md:w-48"
              >
                <option value="">All Status</option>
                {pipelineStages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
            </div>
          </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : jobs.length > 0 ? (
        <>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="card">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        job.jobType === 'internship' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        {job.jobType === 'internship' 
                          ? <GraduationCap className="w-6 h-6 text-purple-500" />
                          : <Briefcase className="w-6 h-6 text-gray-400" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          {job.jobType === 'internship' && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              Internship
                            </span>
                          )}
                          {job.eligibility?.openForAll && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              Open for All
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600">{job.company?.name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {job.maxPositions} positions
                          </span>
                          {job.jobType === 'internship' && job.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.duration}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Deadline: {format(new Date(job.applicationDeadline), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job._id, e.target.value)}
                      className="text-sm border rounded-lg px-2 py-1"
                    >
                      {pipelineStages.map(stage => (
                        <option key={stage.id} value={stage.id}>{stage.label}</option>
                      ))}
                    </select>
                    <Link
                      to={`/coordinator/jobs/${job._id}/edit`}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-5 h-5 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => setDeleteModal({ show: true, jobId: job._id })}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Placements: <span className="font-medium text-green-600">{job.placementsCount || 0}</span>
                    </span>
                    <span className="text-gray-500">
                      Skills: <span className="font-medium">{job.requiredSkills?.length || 0}</span>
                    </span>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </div>
            ))}
          </div>

          <Pagination
            current={pagination.current}
            total={pagination.pages}
            onPageChange={(page) => setPagination({ ...pagination, current: page })}
          />
        </>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Create your first job posting to get started"
          action={
            <Link to="/coordinator/jobs/new" className="btn btn-primary">
              Create Job
            </Link>
          }
        />
      )}
        </>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModal.show}
        title="Delete Job"
        message="Are you sure you want to delete this job? All associated applications will also be affected."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ show: false, jobId: null })}
        danger
      />
    </div>
  );
};

export default CoordinatorJobs;
