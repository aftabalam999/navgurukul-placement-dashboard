import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('Auth error:', error);
        navigate('/auth/login?error=' + error);
        return;
      }

      if (token) {
        try {
          // Decode the token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Store the token and user info
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify({
            id: payload.userId,
            email: payload.email,
            role: payload.role
          }));

          // Update auth context
          login(token, {
            id: payload.userId,
            email: payload.email,
            role: payload.role
          });

          // Redirect based on role
          switch (payload.role) {
            case 'student':
              navigate('/student/dashboard');
              break;
            case 'coordinator':
              navigate('/coordinator/dashboard');
              break;
            case 'campus_poc':
              navigate('/campus-poc/dashboard');
              break;
            case 'manager':
              navigate('/manager/dashboard');
              break;
            default:
              navigate('/');
          }
        } catch (error) {
          console.error('Token processing error:', error);
          navigate('/auth/login?error=invalid_token');
        }
      } else {
        navigate('/auth/login?error=missing_token');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Signing you in...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we complete your authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;