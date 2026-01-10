import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { LoadingSpinner, Pagination, EmptyState, StatusBadge } from '../../components/common/UIComponents';
import { Users, Search, ChevronRight, GraduationCap } from 'lucide-react';

const schools = [
  'School of Programming',
  'School of Business', 
  'School of Finance',
  'School of Education',
  'School of Second Chance'
];

const POCStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: '', school: '', batch: '' });

  useEffect(() => {
    fetchStudents();
  }, [pagination.current, filters]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getStudents({
        page: pagination.current,
        limit: 15,
        search: filters.search || undefined,
        school: filters.school || undefined,
        batch: filters.batch || undefined
      });
      setStudents(response.data.students);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getApprovedSkillsCount = (skills) => {
    return skills?.filter(s => s.status === 'approved').length || 0;
  };

  const getPendingSkillsCount = (skills) => {
    return skills?.filter(s => s.status === 'pending').length || 0;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600">View and manage students from your campus</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
          <select
            value={filters.school}
            onChange={(e) => setFilters({ ...filters, school: e.target.value })}
          >
            <option value="">All Schools</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.batch}
            onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
          >
            <option value="">All Batches</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* Students List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : students.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <Link
                key={student._id}
                to={`/campus-poc/students/${student._id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-semibold">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">School</span>
                      <p className="font-medium text-xs">{student.studentProfile?.currentSchool || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Module</span>
                      <p className="font-medium text-xs">{student.studentProfile?.currentModule || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Profile</span>
                      <p className="font-medium capitalize text-xs">{student.studentProfile?.profileStatus?.replace('_', ' ') || 'Draft'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Skills</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-600">
                          {getApprovedSkillsCount(student.studentProfile?.skills)}
                        </span>
                        {getPendingSkillsCount(student.studentProfile?.skills) > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                            +{getPendingSkillsCount(student.studentProfile?.skills)} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
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
          icon={Users}
          title="No students found"
          description="Try adjusting your search filters"
        />
      )}
    </div>
  );
};

export default POCStudents;
