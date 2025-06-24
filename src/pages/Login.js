import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import LoginForm from '../components/auth/LoginForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { APP_NAME } from '../utils/constants';

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  
  // Get the intended destination from navigation state
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner centered text="Loading..." />;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v6"
              />
            </svg>
          </div>
          
          <h2 className={`text-3xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome to {APP_NAME}
          </h2>
          
          <p className={`mt-2 text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <div className={`bg-white dark:bg-gray-800 py-8 px-6 shadow-soft rounded-lg border ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className={`text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            &copy; 2024 {APP_NAME}. Built for modern dairy farm management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;