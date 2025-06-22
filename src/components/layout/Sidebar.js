import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Beef, 
  Milk, 
  Wheat, 
  Heart, 
  Egg, 
  BarChart3, 
  Users, 
  Settings 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { APP_NAME } from '../../utils/constants';

const Sidebar = () => {
  const { isAdmin, hasPermission } = useAuth();
  const { sidebarCollapsed, getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      permission: null,
    },
    {
      name: 'Cattle',
      href: '/cows',
      icon: Beef,
      permission: 'canViewCows',
    },
    {
      name: 'Milk Records',
      href: '/milk',
      icon: Milk,
      permission: 'canViewMilkRecords',
    },
    {
      name: 'Feed Management',
      href: '/feed',
      icon: Wheat,
      permission: 'canViewFeedRecords',
    },
    {
      name: 'Health Records',
      href: '/health',
      icon: Heart,
      permission: 'canViewHealthRecords',
      adminOnly: true,
    },
    {
      name: 'Poultry',
      href: '/chicken',
      icon: Egg,
      permission: 'canViewChicken',
    },
    {
      name: 'Statistics',
      href: '/stats',
      icon: BarChart3,
      permission: 'canViewStats',
    },
    {
      name: 'User Management',
      href: '/users',
      icon: Users,
      permission: 'canManageUsers',
      adminOnly: true,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      permission: null,
    },
  ];

  const filteredItems = navigationItems.filter(item => {
    // Check admin-only items
    if (item.adminOnly && !isAdmin()) {
      return false;
    }
    
    // Check permissions
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    
    return true;
  });

  return (
    <aside className={`
      fixed top-16 left-0 z-40 h-[calc(100vh-4rem)]
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
      ${themeClasses.surface} ${themeClasses.border}
      border-r transition-all duration-300 ease-in-out
      hidden lg:block
    `}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">DF</span>
            </div>
            {!sidebarCollapsed && (
              <span className={`font-semibold text-lg ${themeClasses.text.primary}`}>
                {APP_NAME.split(' ')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary text-white' 
                    : `${themeClasses.text.secondary} ${themeClasses.hover}`
                  }
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className={`text-xs ${themeClasses.text.muted} text-center`}>
              Version 1.0.0
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;