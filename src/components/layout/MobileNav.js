import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';

const MobileNav = () => {
  const { isAdmin, hasPermission } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed, getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  // Mobile navigation is controlled by the same sidebar state
  const isOpen = sidebarCollapsed;

  const closeMobileNav = () => {
    setSidebarCollapsed(false);
  };

  // Same navigation items as sidebar but filtered for mobile
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', permission: null },
    { name: 'Cattle', href: '/cows', permission: 'canViewCows' },
    { name: 'Milk Records', href: '/milk', permission: 'canViewMilkRecords' },
    { name: 'Feed Management', href: '/feed', permission: 'canViewFeedRecords' },
    { name: 'Health Records', href: '/health', permission: 'canViewHealthRecords', adminOnly: true },
    { name: 'Poultry', href: '/chicken', permission: 'canViewChicken' },
    { name: 'Statistics', href: '/stats', permission: 'canViewStats' },
    { name: 'User Management', href: '/users', permission: 'canManageUsers', adminOnly: true },
    { name: 'Settings', href: '/settings', permission: null },
  ];

  const filteredItems = navigationItems.filter(item => {
    if (item.adminOnly && !isAdmin()) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
          onClick={closeMobileNav}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64
        ${themeClasses.surface}
        transform transition-transform duration-300 ease-in-out
        lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
              Menu
            </h2>
            <button
              onClick={closeMobileNav}
              className={`p-2 rounded-lg ${themeClasses.hover} ${themeClasses.text.secondary}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {filteredItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={closeMobileNav}
                className={({ isActive }) => `
                  flex items-center px-3 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary text-white' 
                    : `${themeClasses.text.primary} ${themeClasses.hover}`
                  }
                `}
              >
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default MobileNav;