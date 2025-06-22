import React from 'react';
import { Beef, Milk, Egg, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatNumber, formatCurrency } from '../../utils/helpers';

const DashboardCards = ({ data, loading }) => {
  const { getThemeClasses } = useTheme();
  const themeClasses = getThemeClasses();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border}`}>
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Cattle',
      value: data?.livestock?.totalCows || 0,
      icon: Beef,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: data?.trends?.cattleTrend,
    },
    {
      title: 'Daily Milk Production',
      value: `${formatNumber(data?.production?.milk?.totalQuantity || 0)} L`,
      icon: Milk,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: data?.trends?.milkTrend,
    },
    {
      title: 'Egg Production',
      value: data?.production?.eggs?.totalQuantity || 0,
      icon: Egg,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      trend: data?.trends?.eggTrend,
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(data?.financial?.revenue || 0),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: data?.trends?.revenueTrend,
    },
  ];

  const getTrendIcon = (trend) => {
    if (!trend) return <Minus size={16} className="text-gray-400" />;
    
    switch (trend.direction) {
      case 'increasing':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'decreasing':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getTrendColor = (trend) => {
    if (!trend) return 'text-gray-400';
    
    switch (trend.direction) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${themeClasses.surface} rounded-lg p-6 border ${themeClasses.border} hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon size={24} className={card.color} />
              </div>
              {card.trend && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(card.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(card.trend)}`}>
                    {card.trend.percentage}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <h3 className={`text-sm font-medium ${themeClasses.text.secondary}`}>
                {card.title}
              </h3>
              <p className={`text-2xl font-bold mt-1 ${themeClasses.text.primary}`}>
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;