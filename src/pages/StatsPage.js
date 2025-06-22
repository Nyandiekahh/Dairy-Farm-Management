// src/pages/StatsPage.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const StatsPage = () => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className="space-y-6">
      <div className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
        <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
          Statistics & Reports
        </h1>
        <p className={`mt-2 ${themeClasses.text.secondary}`}>
          View detailed analytics and generate reports.
        </p>
      </div>
      <div className={`${themeClasses.surface} rounded-lg p-8 border ${themeClasses.border} text-center`}>
        <div className="text-6xl mb-4">📊</div>
        <h2 className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>
          Analytics Coming Soon
        </h2>
        <p className={themeClasses.text.secondary}>
          Comprehensive analytics, reports, and insights for your farm operations.
        </p>
      </div>
    </div>
  );
};

export default StatsPage;