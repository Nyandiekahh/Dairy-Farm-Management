import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const Layout = () => {
  const { sidebarCollapsed, getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      {/* Header */}
      <Header />

      {/* Sidebar for desktop */}
      <Sidebar />

      {/* Mobile navigation */}
      <MobileNav />

      {/* Main content */}
      <main
        className={`
          transition-all duration-300 ease-in-out
          pt-16 min-h-screen
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;