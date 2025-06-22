// src/components/dashboard/ProductionChart.js
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ProductionChart = ({ data, loading }) => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
      <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text.primary}`}>
        Production Overview
      </h3>
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className={themeClasses.text.secondary}>Chart will be implemented here</p>
      </div>
    </div>
  );
};

export default ProductionChart;