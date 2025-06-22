import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

// Re-export the useAuth hook from context for convenience
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;