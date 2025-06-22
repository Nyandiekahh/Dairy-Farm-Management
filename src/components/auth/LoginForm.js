import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validateForm, validateLoginForm } from '../../utils/validators';
import Input from '../common/Input';
import Button from '../common/Button';
import { Eye, EyeOff } from 'lucide-react';

const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const { isValid, errors } = validateForm(formData, validateLoginForm);
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Navigation will be handled by the auth context and protected routes
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Email field */}
      <Input
        label="Email Address"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={formErrors.email}
        required
        placeholder="Enter your email"
        autoComplete="email"
        disabled={isLoading}
      />

      {/* Password field */}
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          required
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          disabled={isLoading}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>

      {/* Demo credentials (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Demo Credentials:
          </h4>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div>
              <strong>Admin:</strong> admin@dairyfarm.com
            </div>
            <div>
              <strong>Farmer:</strong> farmer@dairyfarm.com
            </div>
            <div>
              <strong>Password:</strong> Use your Firebase Auth password
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Note: You'll need to create these users in Firebase Auth first.
          </p>
        </div>
      )}
    </form>
  );
};

export default LoginForm;