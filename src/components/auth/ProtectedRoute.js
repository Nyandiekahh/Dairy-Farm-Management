import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireFarmer = false,
  requirePermission = null 
}) => {
  const { isAuthenticated, isLoading, user, isAdmin, isFarmer, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return <LoadingSpinner centered text="Loading..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. Admin privileges are required.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check farmer requirement
  if (requireFarmer && !isFarmer()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. Farmer privileges are required.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check specific permission requirement
  if (requirePermission && !hasPermission(requirePermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You don't have the required permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return children;
};

export default ProtectedRoute;