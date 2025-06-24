// src/components/dashboard/QuickActions.js
import React from 'react';
import { Plus, FileText, BarChart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

const QuickActions = () => {
  const { hasPermission } = useAuth();
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  const actions = [
    {
      title: 'Add Milk Record',
      description: 'Record today\'s milk production',
      icon: Plus,
      permission: 'canAddMilkRecords',
      href: '/milk',
    },
    {
      title: 'Add Feed Record',
      description: 'Log feeding activities',
      icon: Plus,
      permission: 'canAddFeedRecords',
      href: '/feed',
    },
    {
      title: 'View Reports',
      description: 'Generate production reports',
      icon: FileText,
      permission: 'canViewStats',
      href: '/stats',
    },
    {
      title: 'Farm Analytics',
      description: 'Analyze farm performance',
      icon: BarChart,
      permission: 'canViewStats',
      href: '/stats',
    },
  ];

  const filteredActions = actions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  return (
    <div className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
      <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text.primary}`}>
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <a
              key={index}
              href={action.href}
              className={`
                p-4 rounded-lg border transition-all duration-200
                ${themeClasses.border} ${themeClasses.hover}
                hover:shadow-md
              `}
            >
              <Icon size={24} className="text-primary mb-2" />
              <h4 className={`font-medium mb-1 ${themeClasses.text.primary}`}>
                {action.title}
              </h4>
              <p className={`text-sm ${themeClasses.text.secondary}`}>
                {action.description}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;