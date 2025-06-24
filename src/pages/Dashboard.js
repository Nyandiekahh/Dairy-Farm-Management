import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFarm } from '../contexts/FarmContext';
import { useApi } from '../hooks/useApi';
import { statsAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardCards from '../components/dashboard/DashboardCards';
import ProductionChart from '../components/dashboard/ProductionChart';
import AlertsPanel from '../components/dashboard/AlertsPanel';
import QuickActions from '../components/dashboard/QuickActions';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { selectedFarm } = useFarm();
  const { getThemeClasses } = useTheme();
  const { loading, execute } = useApi();
  const [dashboardData, setDashboardData] = useState(null);
  const themeClasses = getThemeClasses();

  useEffect(() => {
    loadDashboardData();
  }, [selectedFarm]);

  const loadDashboardData = async () => {
    if (!selectedFarm) return;

    const data = await execute(
      () => statsAPI.getDashboard({ 
        farmLocation: selectedFarm,
        period: 'monthly' 
      }),
      {
        onSuccess: (result) => {
          setDashboardData(result.data.dashboardStats);
        }
      }
    );
  };

  if (loading && !dashboardData) {
    return <LoadingSpinner centered text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
              Welcome back, {user?.firstName}!
            </h1>
            <p className={`mt-1 ${themeClasses.text.secondary}`}>
              Here's what's happening at your farm today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className={`text-sm ${themeClasses.text.muted}`}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      {dashboardData && (
        <DashboardCards 
          data={dashboardData}
          loading={loading}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Chart */}
        <div className="lg:col-span-2">
          {dashboardData && (
            <ProductionChart 
              data={dashboardData}
              loading={loading}
            />
          )}
        </div>

        {/* Alerts Panel */}
        <div>
          {dashboardData && (
            <AlertsPanel 
              alerts={dashboardData.alerts || []}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Farm Selection Prompt */}
      {!selectedFarm && (
        <div className={`${themeClasses.surface} rounded-lg p-8 border ${themeClasses.border} text-center`}>
          <div className="text-6xl mb-4">🏭</div>
          <h2 className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>
            Select a Farm
          </h2>
          <p className={`mb-4 ${themeClasses.text.secondary}`}>
            {isAdmin() 
              ? 'Choose a farm from the header to view its dashboard.' 
              : 'No farm assigned to your account. Please contact an administrator.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;