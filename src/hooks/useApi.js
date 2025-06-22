import { useState, useCallback } from 'react';
import { handleApiError } from '../utils/helpers';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const { 
      showLoading = true, 
      onSuccess, 
      onError,
      throwError = false 
    } = options;

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const result = await apiCall();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (throwError) {
        throw err;
      }
      
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
};

// Hook for managing list data with pagination
export const useApiList = (apiCall, dependencies = []) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(params);
      
      if (response.success) {
        setData(response.data.items || response.data);
        setPagination(response.data.pagination || null);
      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    pagination,
    loading,
    error,
    fetchData,
    refresh,
    setData,
  };
};

// Hook for managing single item data
export const useApiItem = (apiCall, id, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(id);
      
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, apiCall, ...dependencies]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    fetchData,
    refresh,
    setData,
  };
};

// Hook for form submissions
export const useApiForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async (apiCall, data, options = {}) => {
    const { 
      onSuccess, 
      onError,
      resetOnSuccess = true 
    } = options;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const result = await apiCall(data);
      
      if (result.success) {
        setSuccess(true);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        if (resetOnSuccess) {
          setTimeout(() => setSuccess(false), 3000);
        }
        
        return result;
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    submitting,
    error,
    success,
    submit,
    clearMessages,
  };
};

export default useApi;