import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Auth error:', error);
        navigate('/auth/login?error=' + error);
        return;
      }

      if (code) {
        try {
          const response = await authAPI.exchange(code);

          // Server sets HttpOnly cookie; response includes user info
          const user = response.data.user;
          if (user) {
            // Persist minimal user info for frontend conveniences
            localStorage.setItem('user', JSON.stringify(user));
            // Update auth context
            // Use updateUser to set user state
            // (we rely on /auth/me for full user data on reload)
            window.dispatchEvent(new CustomEvent('auth:login', { detail: user }));

            // Redirect based on role
            switch (user.role) {
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
          } else {
            navigate('/auth/login?error=oauth_failed');
          }
        } catch (err) {
          console.error('Exchange error:', err);
          navigate('/auth/login?error=oauth_failed');
        }
      } else {
        navigate('/auth/login?error=missing_code');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

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