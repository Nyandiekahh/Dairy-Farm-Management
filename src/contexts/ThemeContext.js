import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { STORAGE_KEYS, THEME } from '../utils/constants';
import { getFromStorage, setToStorage } from '../utils/helpers';

// Initial state
const initialState = {
  isDark: false,
  primaryColor: THEME.PRIMARY_COLOR,
  secondaryColor: THEME.SECONDARY_COLOR,
  accentColor: THEME.ACCENT_COLOR,
  fontSize: 'medium',
  sidebarCollapsed: false,
};

// Action types
const THEME_ACTIONS = {
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_THEME: 'SET_THEME',
  SET_PRIMARY_COLOR: 'SET_PRIMARY_COLOR',
  SET_SECONDARY_COLOR: 'SET_SECONDARY_COLOR',
  SET_ACCENT_COLOR: 'SET_ACCENT_COLOR',
  SET_FONT_SIZE: 'SET_FONT_SIZE',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR_COLLAPSED: 'SET_SIDEBAR_COLLAPSED',
  RESET_THEME: 'RESET_THEME',
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.TOGGLE_THEME:
      return {
        ...state,
        isDark: !state.isDark,
      };

    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        isDark: action.payload,
      };

    case THEME_ACTIONS.SET_PRIMARY_COLOR:
      return {
        ...state,
        primaryColor: action.payload,
      };

    case THEME_ACTIONS.SET_SECONDARY_COLOR:
      return {
        ...state,
        secondaryColor: action.payload,
      };

    case THEME_ACTIONS.SET_ACCENT_COLOR:
      return {
        ...state,
        accentColor: action.payload,
      };

    case THEME_ACTIONS.SET_FONT_SIZE:
      return {
        ...state,
        fontSize: action.payload,
      };

    case THEME_ACTIONS.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };

    case THEME_ACTIONS.SET_SIDEBAR_COLLAPSED:
      return {
        ...state,
        sidebarCollapsed: action.payload,
      };

    case THEME_ACTIONS.RESET_THEME:
      return {
        ...initialState,
      };

    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Load theme from storage on mount
  useEffect(() => {
    const savedTheme = getFromStorage(STORAGE_KEYS.THEME);
    if (savedTheme) {
      Object.entries(savedTheme).forEach(([key, value]) => {
        switch (key) {
          case 'isDark':
            dispatch({ type: THEME_ACTIONS.SET_THEME, payload: value });
            break;
          case 'primaryColor':
            dispatch({ type: THEME_ACTIONS.SET_PRIMARY_COLOR, payload: value });
            break;
          case 'secondaryColor':
            dispatch({ type: THEME_ACTIONS.SET_SECONDARY_COLOR, payload: value });
            break;
          case 'accentColor':
            dispatch({ type: THEME_ACTIONS.SET_ACCENT_COLOR, payload: value });
            break;
          case 'fontSize':
            dispatch({ type: THEME_ACTIONS.SET_FONT_SIZE, payload: value });
            break;
          case 'sidebarCollapsed':
            dispatch({ type: THEME_ACTIONS.SET_SIDEBAR_COLLAPSED, payload: value });
            break;
          default:
            break;
        }
      });
    }
  }, []);

  // Save theme to storage whenever state changes
  useEffect(() => {
    setToStorage(STORAGE_KEYS.THEME, state);
  }, [state]);

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark/light theme
    if (state.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply font size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (state.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
        break;
    }

    // Apply custom CSS variables for colors
    root.style.setProperty('--color-primary', state.primaryColor);
    root.style.setProperty('--color-secondary', state.secondaryColor);
    root.style.setProperty('--color-accent', state.accentColor);
  }, [state]);

  // Toggle dark/light theme
  const toggleTheme = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_THEME });
  };

  // Set specific theme
  const setTheme = (isDark) => {
    dispatch({ type: THEME_ACTIONS.SET_THEME, payload: isDark });
  };

  // Set primary color
  const setPrimaryColor = (color) => {
    dispatch({ type: THEME_ACTIONS.SET_PRIMARY_COLOR, payload: color });
  };

  // Set secondary color
  const setSecondaryColor = (color) => {
    dispatch({ type: THEME_ACTIONS.SET_SECONDARY_COLOR, payload: color });
  };

  // Set accent color
  const setAccentColor = (color) => {
    dispatch({ type: THEME_ACTIONS.SET_ACCENT_COLOR, payload: color });
  };

  // Set font size
  const setFontSize = (size) => {
    dispatch({ type: THEME_ACTIONS.SET_FONT_SIZE, payload: size });
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_SIDEBAR });
  };

  // Set sidebar collapsed state
  const setSidebarCollapsed = (collapsed) => {
    dispatch({ type: THEME_ACTIONS.SET_SIDEBAR_COLLAPSED, payload: collapsed });
  };

  // Reset theme to defaults
  const resetTheme = () => {
    dispatch({ type: THEME_ACTIONS.RESET_THEME });
  };

  // Get theme-specific classes
  const getThemeClasses = () => {
    return {
      background: state.isDark ? 'bg-gray-900' : 'bg-gray-50',
      surface: state.isDark ? 'bg-gray-800' : 'bg-white',
      text: {
        primary: state.isDark ? 'text-white' : 'text-gray-900',
        secondary: state.isDark ? 'text-gray-300' : 'text-gray-600',
        muted: state.isDark ? 'text-gray-400' : 'text-gray-500',
      },
      border: state.isDark ? 'border-gray-700' : 'border-gray-200',
      input: state.isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300',
      hover: state.isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    };
  };

  // Get CSS variables for custom styling
  const getCSSVariables = () => {
    return {
      '--color-primary': state.primaryColor,
      '--color-secondary': state.secondaryColor,
      '--color-accent': state.accentColor,
    };
  };

  // Predefined color schemes
  const colorSchemes = {
    default: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
    },
    blue: {
      primary: '#2563eb',
      secondary: '#3b82f6',
      accent: '#60a5fa',
    },
    purple: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
    },
    orange: {
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fb923c',
    },
    pink: {
      primary: '#db2777',
      secondary: '#ec4899',
      accent: '#f472b6',
    },
  };

  // Apply color scheme
  const applyColorScheme = (schemeName) => {
    const scheme = colorSchemes[schemeName];
    if (scheme) {
      dispatch({ type: THEME_ACTIONS.SET_PRIMARY_COLOR, payload: scheme.primary });
      dispatch({ type: THEME_ACTIONS.SET_SECONDARY_COLOR, payload: scheme.secondary });
      dispatch({ type: THEME_ACTIONS.SET_ACCENT_COLOR, payload: scheme.accent });
    }
  };

  const value = {
    // State
    isDark: state.isDark,
    primaryColor: state.primaryColor,
    secondaryColor: state.secondaryColor,
    accentColor: state.accentColor,
    fontSize: state.fontSize,
    sidebarCollapsed: state.sidebarCollapsed,

    // Actions
    toggleTheme,
    setTheme,
    setPrimaryColor,
    setSecondaryColor,
    setAccentColor,
    setFontSize,
    toggleSidebar,
    setSidebarCollapsed,
    resetTheme,
    applyColorScheme,

    // Helpers
    getThemeClasses,
    getCSSVariables,
    colorSchemes,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;