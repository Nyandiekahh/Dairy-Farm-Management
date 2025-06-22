// src/pages/UsersPage.js
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const UsersPage = () => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className="space-y-6">
      <div className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
        <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
          User Management
        </h1>
        <p className={`mt-2 ${themeClasses.text.secondary}`}>
          Manage user accounts and permissions.
        </p>
      </div>
      <div className={`${themeClasses.surface} rounded-lg p-8 border ${themeClasses.border} text-center`}>
        <div className="text-6xl mb-4">👥</div>
        <h2 className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>
          User Management Coming Soon
        </h2>
        <p className={themeClasses.text.secondary}>
          Create and manage user accounts, roles, and permissions for your farm.
        </p>
      </div>
    </div>
  );
};

export default UsersPage;