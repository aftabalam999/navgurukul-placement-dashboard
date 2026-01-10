import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import { Menu, Bell, LogOut, ChevronDown, User } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications({ limit: 5 });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getBasePath = () => {
    const paths = {
      student: '/student',
      campus_poc: '/campus-poc',
      coordinator: '/coordinator',
      manager: '/manager'
    };
    return paths[user?.role] || '/';
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Mobile menu button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search - hidden on mobile */}
        <div className="hidden md:block flex-1 max-w-md">
          <input
            type="search"
            placeholder="Search..."
            className="w-full px-4 py-2 bg-gray-100 border-0 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border animate-fadeIn">
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="font-semibold">Notifications</h3>
                  <Link 
                    to={`${getBasePath()}/notifications`}
                    className="text-sm text-primary-600 hover:underline"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif._id}
                        onClick={() => markAsRead(notif._id)}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          !notif.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-sm text-gray-600 truncate">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-gray-500">No notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 hidden md:block" />
            </button>

            {/* User dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border animate-fadeIn">
                <div className="p-3 border-b">
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                {user?.role === 'student' && (
                  <Link
                    to="/student/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
