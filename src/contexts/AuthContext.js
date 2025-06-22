import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/auth';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth service
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        
        await authService.initialize();
        
        const user = authService.getCurrentUser();
        const token = authService.getCurrentToken();
        
        if (user && token) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: { user, token },
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      if (user) {
        const token = authService.getCurrentToken();
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token },
        });
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    });

    return unsubscribe;
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.login(email, password);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: result.user,
          token: result.token,
        },
      });

      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if service fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Register function (admin only)
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.register(userData);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.changePassword(currentPassword, newPassword);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Password change failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.updateProfile(profileData);
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: result.user,
      });
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Profile update failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.resetPassword(email);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return result;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Password reset failed';
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      throw error;
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Helper functions
  const isAdmin = () => authService.isAdmin();
  const isFarmer = () => authService.isFarmer();
  const getUserFarm = () => authService.getUserFarm();
  const hasPermission = (permission) => authService.hasPermission(permission);

  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    logout,
    register,
    changePassword,
    updateProfile,
    resetPassword,
    clearError,

    // Helper functions
    isAdmin,
    isFarmer,
    getUserFarm,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;