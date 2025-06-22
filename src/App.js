import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { FarmProvider } from './contexts/FarmContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CowsPage from './pages/CowsPage';
import MilkPage from './pages/MilkPage';
import FeedPage from './pages/FeedPage';
import HealthPage from './pages/HealthPage';
import ChickenPage from './pages/ChickenPage';
import StatsPage from './pages/StatsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';

// Styles
import './styles/globals.css';
import './styles/components.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠</div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                An unexpected error occurred. Please refresh the page or contact support if the problem persists.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <FarmProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Protected Routes */}
                  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="cows" element={<CowsPage />} />
                    <Route path="milk" element={<MilkPage />} />
                    <Route path="feed" element={<FeedPage />} />
                    <Route path="health" element={<ProtectedRoute requireAdmin><HealthPage /></ProtectedRoute>} />
                    <Route path="chicken" element={<ChickenPage />} />
                    <Route path="stats" element={<StatsPage />} />
                    <Route path="users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>

                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      style: {
                        background: '#10b981',
                      },
                    },
                    error: {
                      duration: 5000,
                      style: {
                        background: '#ef4444',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </FarmProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;