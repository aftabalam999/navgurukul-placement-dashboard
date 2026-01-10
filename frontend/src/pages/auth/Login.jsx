import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <GraduationCap className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Placement Dashboard</h1>
          <p className="text-primary-200 mt-1">Welcome back! Please sign in.</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-medium hover:underline">
                Register here
              </Link>
            </p>
          </div>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 text-center mb-3">Demo Accounts:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">Student</p>
                <p className="text-gray-500">john.doe@student.edu</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">Campus POC</p>
                <p className="text-gray-500">poc.main@placement.edu</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">Coordinator</p>
                <p className="text-gray-500">coordinator@placement.edu</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-medium">Manager</p>
                <p className="text-gray-500">manager@placement.edu</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
