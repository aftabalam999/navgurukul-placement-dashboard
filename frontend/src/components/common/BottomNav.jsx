import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Home, User, Briefcase, Users, Target, FileText, ClipboardCheck
} from 'lucide-react';

const BottomNav = () => {
    const { user } = useAuth();

    if (!user) return null;

    const getNavItems = () => {
        switch (user.role) {
            case 'student':
                return [
                    { path: '/student', icon: Home, label: 'Home' },
                    { path: '/student/jobs', icon: Briefcase, label: 'Jobs' },
                    { path: '/student/job-readiness', icon: Target, label: 'Readiness' },
                    { path: '/student/profile', icon: User, label: 'Profile' }
                ];
            case 'campus_poc':
                return [
                    { path: '/campus-poc', icon: Home, label: 'Home' },
                    { path: '/campus-poc/students', icon: Users, label: 'Students' },
                    { path: '/campus-poc/job-readiness', icon: Target, label: 'Readiness' },
                    { path: '/campus-poc/profile-approvals', icon: ClipboardCheck, label: 'Review' }
                ];
            case 'coordinator':
                return [
                    { path: '/coordinator', icon: Home, label: 'Home' },
                    { path: '/coordinator/jobs', icon: Briefcase, label: 'Jobs' },
                    { path: '/coordinator/applications', icon: FileText, label: 'Apps' },
                    { path: '/coordinator/job-readiness', icon: Target, label: 'Readiness' }
                ];
            case 'manager':
                return [
                    { path: '/manager', icon: Home, label: 'Home' },
                    { path: '/manager/reports', icon: FileText, label: 'Reports' },
                    { path: '/manager/job-readiness', icon: Target, label: 'Readiness' }
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-1 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-14">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path.split('/').length === 2}
                            className={({ isActive }) => `
                                flex flex-col items-center justify-center flex-1 min-w-0 transition-all duration-200
                                ${isActive ? 'text-primary-600 scale-110' : 'text-gray-400 hover:text-gray-600'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon className="w-6 h-6" />
                                    <span className="text-[10px] font-medium mt-1 truncate w-full text-center">
                                        {item.label}
                                    </span>
                                    {/* Active dot indicator */}
                                    <div className={`mt-0.5 w-1 h-1 rounded-full transition-opacity duration-200 ${isActive ? 'opacity-100 bg-primary-600' : 'opacity-0'}`} />
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
