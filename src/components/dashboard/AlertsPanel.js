// src/components/dashboard/AlertsPanel.js
import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const AlertsPanel = ({ alerts, loading }) => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
      <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text.primary}`}>
        Alerts & Notifications
      </h3>
      
      {alerts && alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${themeClasses.text.primary}`}>
                  {alert.title}
                </h4>
                <p className={`text-xs mt-1 ${themeClasses.text.secondary}`}>
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
          <p className={themeClasses.text.secondary}>No alerts at this time</p>
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;