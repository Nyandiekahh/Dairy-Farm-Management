// src/pages/CowsPage.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const CowsPage = () => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className="space-y-6">
      <div className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
        <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
          Cattle Management
        </h1>
        <p className={`mt-2 ${themeClasses.text.secondary}`}>
          Manage your cattle records, breeding, and health information.
        </p>
      </div>
      <div className={`${themeClasses.surface} rounded-lg p-8 border ${themeClasses.border} text-center`}>
        <div className="text-6xl mb-4">🐄</div>
        <h2 className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>
          Cattle Management Coming Soon
        </h2>
        <p className={themeClasses.text.secondary}>
          This feature will allow you to manage your cattle records, track breeding, and monitor health.
        </p>
      </div>
    </div>
  );
};

export default CowsPage;