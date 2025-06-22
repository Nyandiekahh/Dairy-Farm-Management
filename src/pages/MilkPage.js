// src/pages/MilkPage.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const MilkPage = () => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className="space-y-6">
      <div className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
        <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
          Milk Production Records
        </h1>
        <p className={`mt-2 ${themeClasses.text.secondary}`}>
          Track daily milk production across all milking sessions.
        </p>
      </div>
      <div className={`${themeClasses.surface} rounded-lg p-8 border ${themeClasses.border} text-center`}>
        <div className="text-6xl mb-4">🥛</div>
        <h2 className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>
          Milk Records Coming Soon
        </h2>
        <p className={themeClasses.text.secondary}>
          Record and track milk production for each cow across morning, afternoon, and evening sessions.
        </p>
      </div>
    </div>
  );
};

export default MilkPage;