import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { farmsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../utils/constants';
import { getFromStorage, setToStorage } from '../utils/helpers';

// Initial state
const initialState = {
  farms: [],
  selectedFarm: null,
  farmSettings: null,
  farmSummary: null,
  isLoading: false,
  error: null,
};

// Action types
const FARM_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_FARMS: 'SET_FARMS',
  SET_SELECTED_FARM: 'SET_SELECTED_FARM',
  SET_FARM_SETTINGS: 'SET_FARM_SETTINGS',
  SET_FARM_SUMMARY: 'SET_FARM_SUMMARY',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const farmReducer = (state, action) => {
  switch (action.type) {
    case FARM_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case FARM_ACTIONS.SET_FARMS:
      return {
        ...state,
        farms: action.payload,
        isLoading: false,
        error: null,
      };

    case FARM_ACTIONS.SET_SELECTED_FARM:
      return {
        ...state,
        selectedFarm: action.payload,
        error: null,
      };

    case FARM_ACTIONS.SET_FARM_SETTINGS:
      return {
        ...state,
        farmSettings: action.payload,
        error: null,
      };

    case FARM_ACTIONS.SET_FARM_SUMMARY:
      return {
        ...state,
        farmSummary: action.payload,
        error: null,
      };

    case FARM_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case FARM_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const FarmContext = createContext();

// Provider component
export const FarmProvider = ({ children }) => {
  const [state, dispatch] = useReducer(farmReducer, initialState);
  const { user, isAuthenticated, isFarmer, getUserFarm } = useAuth();

  // Load farms on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadFarms();
    }
  }, [isAuthenticated]);

  // Set initial selected farm for farmers
  useEffect(() => {
    if (isAuthenticated && isFarmer() && !state.selectedFarm) {
      const userFarm = getUserFarm();
      if (userFarm) {
        selectFarm(userFarm);
      }
    }
  }, [isAuthenticated, user, state.selectedFarm]);

  // Restore selected farm from storage for admins
  useEffect(() => {
    if (isAuthenticated && !isFarmer() && !state.selectedFarm) {
      const storedFarm = getFromStorage(STORAGE_KEYS.SELECTED_FARM);
      if (storedFarm) {
        selectFarm(storedFarm);
      }
    }
  }, [isAuthenticated, user, state.selectedFarm]);

  // Load all farms
  const loadFarms = async () => {
    try {
      dispatch({ type: FARM_ACTIONS.SET_LOADING, payload: true });
      
      const response = await farmsAPI.getAll();
      
      if (response.success) {
        dispatch({
          type: FARM_ACTIONS.SET_FARMS,
          payload: response.data,
        });
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to load farms');
      }
    } catch (error) {
      console.error('Load farms error:', error);
      dispatch({
        type: FARM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to load farms',
      });
      throw error;
    }
  };

  // Select farm
  const selectFarm = (farmLocation) => {
    dispatch({
      type: FARM_ACTIONS.SET_SELECTED_FARM,
      payload: farmLocation,
    });
    
    // Store selection for admins
    if (!isFarmer()) {
      setToStorage(STORAGE_KEYS.SELECTED_FARM, farmLocation);
    }
    
    // Load farm data
    loadFarmSettings(farmLocation);
    loadFarmSummary(farmLocation);
  };

  // Load farm settings
  const loadFarmSettings = async (farmLocation) => {
    try {
      const response = await farmsAPI.getSettings(farmLocation);
      
      if (response.success) {
        dispatch({
          type: FARM_ACTIONS.SET_FARM_SETTINGS,
          payload: response.data,
        });
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to load farm settings');
      }
    } catch (error) {
      console.error('Load farm settings error:', error);
      dispatch({
        type: FARM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to load farm settings',
      });
      throw error;
    }
  };

  // Load farm summary
  const loadFarmSummary = async (farmLocation, params = {}) => {
    try {
      const response = await farmsAPI.getSummary(farmLocation, params);
      
      if (response.success) {
        dispatch({
          type: FARM_ACTIONS.SET_FARM_SUMMARY,
          payload: response.data,
        });
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to load farm summary');
      }
    } catch (error) {
      console.error('Load farm summary error:', error);
      dispatch({
        type: FARM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to load farm summary',
      });
      throw error;
    }
  };

  // Update farm settings
  const updateFarmSettings = async (farmLocation, settings) => {
    try {
      dispatch({ type: FARM_ACTIONS.SET_LOADING, payload: true });
      
      const response = await farmsAPI.updateSettings(farmLocation, settings);
      
      if (response.success) {
        dispatch({
          type: FARM_ACTIONS.SET_FARM_SETTINGS,
          payload: response.data.settings,
        });
        dispatch({ type: FARM_ACTIONS.SET_LOADING, payload: false });
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to update farm settings');
      }
    } catch (error) {
      console.error('Update farm settings error:', error);
      dispatch({
        type: FARM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to update farm settings',
      });
      throw error;
    }
  };

  // Create new farm (admin only)
  const createFarm = async (farmData) => {
    try {
      dispatch({ type: FARM_ACTIONS.SET_LOADING, payload: true });
      
      const response = await farmsAPI.create(farmData);
      
      if (response.success) {
        // Reload farms list
        await loadFarms();
        return response;
      } else {
        throw new Error(response.error || 'Failed to create farm');
      }
    } catch (error) {
      console.error('Create farm error:', error);
      dispatch({
        type: FARM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to create farm',
      });
      throw error;
    }
  };

  // Update farm (admin only)
  const updateFarm = async (farmId, farmData) => {
    try {
      dispatch({ type: FARM_ACTIONS.SET_LOADING, payload: true });
      
      const response = await farmsAPI.update(farmId, farmData);
      
      if (response.success) {
        // Reload farms list
        await loadFarms();
        return response;
      } else {
        throw new Error(response.error || 'Failed to update farm');
      }
    } catch (error) {
      console.error('Update farm error:', error);
      dispatch({
        type: FARM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to update farm',
      });
      throw error;
    }
  };

  // Delete farm (admin only)
  const deleteFarm = async (farmId) => {
    try {
      dispatch({ type: FARM_ACTIONS.SET_LOADING, payload: true });
      
      const response = await farmsAPI.delete(farmId);
      
      if (response.success) {
        // Reload farms list
        await loadFarms();
        return response;
      } else {
        throw new Error(response.error || 'Failed to delete farm');
      }
    } catch (error) {
      console.error('Delete farm error:', error);
      dispatch({
        type: FARM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to delete farm',
      });
      throw error;
    }
  };

  // Initialize farm data
  const initializeFarm = async (farmLocation) => {
    try {
      dispatch({ type: FARM_ACTIONS.SET_LOADING, payload: true });
      
      const response = await farmsAPI.initialize(farmLocation);
      
      if (response.success) {
        // Reload farm settings after initialization
        await loadFarmSettings(farmLocation);
        dispatch({ type: FARM_ACTIONS.SET_LOADING, payload: false });
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to initialize farm');
      }
    } catch (error) {
      console.error('Initialize farm error:', error);
      dispatch({
        type: FARM_ACTIONS.SET_ERROR,
        payload: error.message || 'Failed to initialize farm',
      });
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: FARM_ACTIONS.CLEAR_ERROR });
  };

  // Refresh farm data
  const refreshFarmData = async (farmLocation = state.selectedFarm) => {
    if (!farmLocation) return;
    
    try {
      await Promise.all([
        loadFarmSettings(farmLocation),
        loadFarmSummary(farmLocation),
      ]);
    } catch (error) {
      console.error('Refresh farm data error:', error);
    }
  };

  // Get farm by location
  const getFarmByLocation = (farmLocation) => {
    return state.farms.find(farm => farm.location === farmLocation);
  };

  // Get available farms for current user
  const getAvailableFarms = () => {
    if (isFarmer()) {
      const userFarm = getUserFarm();
      return state.farms.filter(farm => farm.location === userFarm);
    }
    return state.farms;
  };

  // Check if user can access farm
  const canAccessFarm = (farmLocation) => {
    if (!isAuthenticated) return false;
    
    if (isFarmer()) {
      const userFarm = getUserFarm();
      return farmLocation === userFarm;
    }
    
    // Admins can access all farms
    return true;
  };

  const value = {
    // State
    farms: state.farms,
    selectedFarm: state.selectedFarm,
    farmSettings: state.farmSettings,
    farmSummary: state.farmSummary,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loadFarms,
    selectFarm,
    loadFarmSettings,
    loadFarmSummary,
    updateFarmSettings,
    createFarm,
    updateFarm,
    deleteFarm,
    initializeFarm,
    clearError,
    refreshFarmData,

    // Helper functions
    getFarmByLocation,
    getAvailableFarms,
    canAccessFarm,
  };

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};

// Hook to use farm context
export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};

export default FarmContext;