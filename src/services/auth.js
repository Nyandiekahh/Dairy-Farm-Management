import { authService as firebaseAuth } from './firebase';
import { authAPI } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { setToStorage, getFromStorage, removeFromStorage } from '../utils/helpers';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.initialized = false;
  }

  // Initialize auth service
  async initialize() {
    if (this.initialized) return;

    try {
      // Check for stored token and user data
      const storedToken = getFromStorage(STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = getFromStorage(STORAGE_KEYS.USER_DATA);

      if (storedToken && storedUser) {
        // Verify token with backend
        const response = await authAPI.verify();
        if (response.success) {
          this.token = storedToken;
          this.currentUser = response.data.user;
        } else {
          // Token is invalid, clear storage
          this.clearAuthData();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.clearAuthData();
    }

    this.initialized = true;
  }

  // Login with email and password
  async login(email, password) {
    try {
      // Authenticate with Firebase
      const firebaseResult = await firebaseAuth.signIn(email, password);
      const token = firebaseResult.token;

      // Verify with backend and get user data
      const response = await authAPI.login({ email, password });
      
      if (response.success) {
        const user = response.data.user;
        
        // Store auth data
        this.token = token;
        this.currentUser = user;
        setToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
        setToStorage(STORAGE_KEYS.USER_DATA, user);

        return { success: true, user, token };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      // Logout from Firebase
      await firebaseAuth.signOut();
      
      // Notify backend
      try {
        await authAPI.logout();
      } catch (error) {
        // Continue even if backend logout fails
        console.warn('Backend logout failed:', error);
      }

      // Clear auth data
      this.clearAuthData();
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Clear data even if logout fails
      this.clearAuthData();
      throw error;
    }
  }

  // Register new user (admin only)
  async register(userData) {
    try {
      const response = await authAPI.register(userData);
      if (response.success) {
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      // Update password in Firebase
      await firebaseAuth.updatePassword(newPassword);
      
      // Update password in backend
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword
      });

      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.error || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        const updatedUser = response.data.user;
        this.currentUser = updatedUser;
        setToStorage(STORAGE_KEYS.USER_DATA, updatedUser);
        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await firebaseAuth.resetPassword(email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get current token
  getCurrentToken() {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(this.token && this.currentUser);
  }

  // Check if user is admin
  isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  // Check if user is farmer
  isFarmer() {
    return this.currentUser?.role === 'farmer';
  }

  // Get user's assigned farm
  getUserFarm() {
    return this.currentUser?.assignedFarm;
  }

  // Check if user has permission
  hasPermission(permission) {
    if (!this.currentUser?.permissions) return false;
    return this.currentUser.permissions[permission] === true;
  }

  // Clear authentication data
  clearAuthData() {
    this.token = null;
    this.currentUser = null;
    removeFromStorage(STORAGE_KEYS.AUTH_TOKEN);
    removeFromStorage(STORAGE_KEYS.USER_DATA);
  }

  // Listen for authentication state changes
  onAuthStateChange(callback) {
    return firebaseAuth.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        try {
          const token = await firebaseUser.getIdToken();
          
          // Verify with backend if we don't have user data
          if (!this.currentUser) {
            const response = await authAPI.verify();
            if (response.success) {
              this.token = token;
              this.currentUser = response.data.user;
              setToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
              setToStorage(STORAGE_KEYS.USER_DATA, this.currentUser);
            }
          }
          
          callback(this.currentUser);
        } catch (error) {
          console.error('Auth state change error:', error);
          this.clearAuthData();
          callback(null);
        }
      } else {
        // User is signed out
        this.clearAuthData();
        callback(null);
      }
    });
  }

  // Refresh token
  async refreshToken() {
    try {
      const token = await firebaseAuth.getCurrentToken();
      if (token) {
        this.token = token;
        setToStorage(STORAGE_KEYS.AUTH_TOKEN, token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;