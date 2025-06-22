import { useState, useEffect, useCallback } from 'react';
import { getFromStorage, setToStorage, removeFromStorage } from '../utils/helpers';

export const useLocalStorage = (key, initialValue) => {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = getFromStorage(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (valueToStore === null || valueToStore === undefined) {
        removeFromStorage(key);
      } else {
        setToStorage(key, valueToStore);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      removeFromStorage(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to this key in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
};

// Hook for managing multiple localStorage values
export const useLocalStorageState = (storageKey, initialState = {}) => {
  const [state, setState] = useLocalStorage(storageKey, initialState);

  const updateState = useCallback((updates) => {
    setState(prevState => ({
      ...prevState,
      ...updates
    }));
  }, [setState]);

  const resetState = useCallback(() => {
    setState(initialState);
  }, [setState, initialState]);

  return [state, updateState, resetState];
};

// Hook for managing boolean localStorage values
export const useLocalStorageBoolean = (key, initialValue = false) => {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, [setValue]);

  const setTrue = useCallback(() => {
    setValue(true);
  }, [setValue]);

  const setFalse = useCallback(() => {
    setValue(false);
  }, [setValue]);

  return {
    value: Boolean(value),
    setValue,
    toggle,
    setTrue,
    setFalse,
    removeValue
  };
};

// Hook for managing array localStorage values
export const useLocalStorageArray = (key, initialValue = []) => {
  const [array, setArray, removeArray] = useLocalStorage(key, initialValue);

  const addItem = useCallback((item) => {
    setArray(prev => [...prev, item]);
  }, [setArray]);

  const removeItem = useCallback((index) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, [setArray]);

  const updateItem = useCallback((index, newItem) => {
    setArray(prev => prev.map((item, i) => i === index ? newItem : item));
  }, [setArray]);

  const clearArray = useCallback(() => {
    setArray([]);
  }, [setArray]);

  const findItem = useCallback((predicate) => {
    return array.find(predicate);
  }, [array]);

  const findItemIndex = useCallback((predicate) => {
    return array.findIndex(predicate);
  }, [array]);

  return {
    array,
    setArray,
    addItem,
    removeItem,
    updateItem,
    clearArray,
    findItem,
    findItemIndex,
    removeArray
  };
};

// Hook for managing recent items (like search history)
export const useRecentItems = (key, maxItems = 10) => {
  const [items, setItems, removeItems] = useLocalStorage(key, []);

  const addItem = useCallback((item) => {
    setItems(prev => {
      // Remove existing item if it exists
      const filtered = prev.filter(existingItem => 
        JSON.stringify(existingItem) !== JSON.stringify(item)
      );
      
      // Add new item to beginning and limit to maxItems
      return [item, ...filtered].slice(0, maxItems);
    });
  }, [setItems, maxItems]);

  const removeItem = useCallback((itemToRemove) => {
    setItems(prev => prev.filter(item => 
      JSON.stringify(item) !== JSON.stringify(itemToRemove)
    ));
  }, [setItems]);

  const clearItems = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    items,
    addItem,
    removeItem,
    clearItems,
    removeAll: removeItems
  };
};

// Hook for managing user preferences
export const useUserPreferences = (defaultPreferences = {}) => {
  const [preferences, setPreferences, removePreferences] = useLocalStorage(
    'user_preferences', 
    defaultPreferences
  );

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setPreferences]);

  const getPreference = useCallback((key, fallback = null) => {
    return preferences[key] !== undefined ? preferences[key] : fallback;
  }, [preferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, [setPreferences, defaultPreferences]);

  return {
    preferences,
    updatePreference,
    getPreference,
    resetPreferences,
    removePreferences
  };
};

export default useLocalStorage;