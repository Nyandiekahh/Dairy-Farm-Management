
// src/pages/ChickenPage.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ChickenPage = () => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className="space-y-6">
      <div className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
        <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
          Poultry Management
        </h1>
        <p className={`mt-2 ${themeClasses.text.secondary}`}>
          Manage chicken batches and track egg production.
        </p>
      </div>
      <div className={`${themeClasses.surface} rounded-lg p-8 border ${themeClasses.border} text-center`}>
        <div className="text-6xl mb-4">🐔</div>
        <h2 className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>
          Poultry Management Coming Soon
        </h2>
        <p className={themeClasses.text.secondary}>
          Manage chicken batches, track egg production, and monitor poultry health.
        </p>
      </div>
    </div>
  );
};

export default ChickenPage;
