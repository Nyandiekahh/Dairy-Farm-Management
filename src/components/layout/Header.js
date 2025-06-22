import React from 'react';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { useFarm } from '../../contexts/FarmContext';
import { formatFarmName } from '../../utils/formatters';
import Button from '../common/Button';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { toggleSidebar, getThemeClasses } = useTheme();
  const { selectedFarm } = useFarm();
  const themeClasses = getThemeClasses();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50 h-16
      ${themeClasses.surface} ${themeClasses.border}
      border-b shadow-sm
    `}>
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className={`
              lg:hidden p-2 rounded-lg transition-colors
              ${themeClasses.hover} ${themeClasses.text.secondary}
            `}
          >
            <Menu size={20} />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className={`
              hidden lg:block p-2 rounded-lg transition-colors
              ${themeClasses.hover} ${themeClasses.text.secondary}
            `}
          >
            <Menu size={20} />
          </button>

          {/* Farm indicator */}
          {selectedFarm && (
            <div className={`
              hidden sm:flex items-center gap-2 px-3 py-1 rounded-full
              bg-primary/10 text-primary
            `}>
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm font-medium">
                {formatFarmName(selectedFarm)}
              </span>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className={`
            relative p-2 rounded-lg transition-colors
            ${themeClasses.hover} ${themeClasses.text.secondary}
          `}>
            <Bell size={20} />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative group">
            <button className={`
              flex items-center gap-2 p-2 rounded-lg transition-colors
              ${themeClasses.hover}
            `}>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className={`text-sm font-medium ${themeClasses.text.primary}`}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div className={`text-xs ${themeClasses.text.secondary}`}>
                  {isAdmin() ? 'Administrator' : 'Farmer'}
                </div>
              </div>
            </button>

            {/* Dropdown menu */}
            <div className={`
              absolute right-0 top-full mt-2 w-48 py-2 
              ${themeClasses.surface} ${themeClasses.border}
              border rounded-lg shadow-lg opacity-0 invisible
              group-hover:opacity-100 group-hover:visible
              transition-all duration-200
            `}>
              <a href="/settings" className={`
                flex items-center gap-2 px-4 py-2 text-sm
                ${themeClasses.text.primary} ${themeClasses.hover}
              `}>
                <Settings size={16} />
                Settings
              </a>
              <hr className={`my-1 ${themeClasses.border}`} />
              <button
                onClick={handleLogout}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm w-full text-left
                  text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
                `}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;