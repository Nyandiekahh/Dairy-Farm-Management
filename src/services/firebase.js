import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Auth service functions
export const authService = {
  // Sign in with email and password
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      return {
        user: userCredential.user,
        token
      };
    } catch (error) {
      console.error('Firebase sign in error:', error);
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase sign out error:', error);
      throw error;
    }
  },

  // Get current user token
  getCurrentToken: async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  // Update password
  updatePassword: async (newPassword) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
      } else {
        throw new Error('No user is currently signed in');
      }
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  // Send password reset email
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: () => {
    return auth.currentUser;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!auth.currentUser;
  }
};

export default app;