import { 
  FARM_DISPLAY_NAMES, 
  SESSION_DISPLAY_NAMES, 
  STAGE_DISPLAY_NAMES, 
  FEED_DISPLAY_NAMES,
  PERIOD_DISPLAY_NAMES 
} from './constants';
import { formatDate, formatCurrency, formatNumber, titleCase } from './helpers';

// Farm Formatters
export const formatFarmName = (farmLocation) => {
  return FARM_DISPLAY_NAMES[farmLocation] || titleCase(farmLocation);
};

// Session Formatters
export const formatSession = (session) => {
  return SESSION_DISPLAY_NAMES[session] || titleCase(session);
};

// Stage Formatters
export const formatStage = (stage) => {
  return STAGE_DISPLAY_NAMES[stage] || titleCase(stage.replace('_', ' '));
};

// Feed Formatters
export const formatFeedType = (feedType) => {
  return FEED_DISPLAY_NAMES[feedType] || titleCase(feedType.replace('_', ' '));
};

// Period Formatters
export const formatPeriod = (period) => {
  return PERIOD_DISPLAY_NAMES[period] || titleCase(period);
};

// Milk Formatters
export const formatMilkQuantity = (quantity) => {
  return `${formatNumber(quantity, 1)} L`;
};

export const formatMilkRecord = (record) => {
  return {
    ...record,
    formattedQuantity: formatMilkQuantity(record.quantity),
    formattedSession: formatSession(record.session),
    formattedDate: formatDate(record.date),
    formattedFarm: formatFarmName(record.farmLocation)
  };
};

// Cow Formatters
export const formatCowAge = (age, ageInDays) => {
  if (age >= 1) {
    return `${age} year${age > 1 ? 's' : ''}`;
  }
  const months = Math.floor(ageInDays / 30);
  if (months >= 1) {
    return `${months} month${months > 1 ? 's' : ''}`;
  }
  return `${ageInDays} day${ageInDays > 1 ? 's' : ''}`;
};

export const formatCow = (cow) => {
  return {
    ...cow,
    formattedAge: formatCowAge(cow.age, cow.ageInDays),
    formattedStage: formatStage(cow.currentStage),
    formattedFarm: formatFarmName(cow.farmLocation),
    formattedPrice: cow.purchasePrice ? formatCurrency(cow.purchasePrice) : 'N/A',
    formattedDailyMilk: cow.averageDailyMilk ? formatMilkQuantity(cow.averageDailyMilk) : 'N/A'
  };
};

// Feed Formatters
export const formatFeedQuantity = (quantity, unit = 'kg') => {
  return `${formatNumber(quantity, 1)} ${unit}`;
};

export const formatFeedRecord = (record) => {
  return {
    ...record,
    formattedQuantity: formatFeedQuantity(record.quantity, record.unit),
    formattedType: formatFeedType(record.feedType),
    formattedDate: formatDate(record.date),
    formattedFarm: formatFarmName(record.farmLocation)
  };
};

// Health Formatters
export const formatHealthCost = (cost) => {
  return formatCurrency(cost);
};

export const formatHealthRecord = (record) => {
  return {
    ...record,
    formattedCost: formatHealthCost(record.cost),
    formattedDate: formatDate(record.dateOfIllness),
    formattedTreatmentDate: formatDate(record.dateOfTreatment),
    formattedFollowUpDate: record.followUpDate ? formatDate(record.followUpDate) : 'None',
    formattedFarm: formatFarmName(record.farmLocation),
    statusColor: record.isResolved ? 'text-green-600' : 'text-red-600'
  };
};

// Chicken Formatters
export const formatChickenCount = (count) => {
  return `${count} bird${count !== 1 ? 's' : ''}`;
};

export const formatEggQuantity = (quantity) => {
  return `${quantity} egg${quantity !== 1 ? 's' : ''}`;
};

export const formatChickenBatch = (batch) => {
  return {
    ...batch,
    formattedCurrentCount: formatChickenCount(batch.currentCount),
    formattedInitialCount: formatChickenCount(batch.initialCount),
    formattedCost: batch.cost ? formatCurrency(batch.cost) : 'N/A',
    formattedDate: formatDate(batch.dateAcquired),
    formattedFarm: formatFarmName(batch.farmLocation),
    mortalityRate: batch.initialCount > 0 ? 
      formatNumber((batch.totalDeaths / batch.initialCount) * 100, 1) + '%' : '0%'
  };
};

export const formatEggRecord = (record) => {
  return {
    ...record,
    formattedQuantity: formatEggQuantity(record.quantity),
    formattedDate: formatDate(record.date),
    formattedFarm: formatFarmName(record.farmLocation)
  };
};

// Statistics Formatters
export const formatStatValue = (value, type = 'number') => {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatNumber(value, 1) + '%';
    case 'milk':
      return formatMilkQuantity(value);
    case 'feed':
      return formatFeedQuantity(value);
    case 'eggs':
      return formatEggQuantity(value);
    case 'count':
      return value.toString();
    default:
      return formatNumber(value);
  }
};

export const formatTrend = (trend) => {
  const { direction, percentage } = trend;
  const arrow = direction === 'increasing' ? '↗' : direction === 'decreasing' ? '↘' : '→';
  const color = direction === 'increasing' ? 'text-green-600' : 
                direction === 'decreasing' ? 'text-red-600' : 'text-gray-600';
  
  return {
    text: `${arrow} ${percentage}%`,
    color,
    direction
  };
};

// Dashboard Formatters
export const formatDashboardCard = (card) => {
  return {
    ...card,
    formattedValue: formatStatValue(card.value, card.type),
    formattedChange: card.change ? formatTrend(card.change) : null
  };
};

// User Formatters
export const formatUserRole = (role) => {
  return titleCase(role);
};

export const formatUser = (user) => {
  return {
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    formattedRole: formatUserRole(user.role),
    formattedFarm: user.assignedFarm ? formatFarmName(user.assignedFarm) : 'All Farms',
    statusColor: user.isActive ? 'text-green-600' : 'text-red-600',
    statusText: user.isActive ? 'Active' : 'Inactive'
  };
};

// Date Range Formatters
export const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return 'All time';
  if (!endDate) return `From ${formatDate(startDate)}`;
  if (!startDate) return `Until ${formatDate(endDate)}`;
  
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (start === end) return start;
  return `${start} - ${end}`;
};

// Report Formatters
export const formatReportData = (data, type) => {
  switch (type) {
    case 'milk':
      return data.map(formatMilkRecord);
    case 'cows':
      return data.map(formatCow);
    case 'feed':
      return data.map(formatFeedRecord);
    case 'health':
      return data.map(formatHealthRecord);
    case 'eggs':
      return data.map(formatEggRecord);
    case 'chicken':
      return data.map(formatChickenBatch);
    case 'users':
      return data.map(formatUser);
    default:
      return data;
  }
};

// Export filename formatters
export const formatExportFilename = (type, dateRange, farm) => {
  const date = new Date().toISOString().split('T')[0];
  const farmName = farm ? formatFarmName(farm).replace(/\s+/g, '_') : 'All_Farms';
  const rangeSuffix = dateRange ? `_${dateRange.replace(/\s+/g, '_')}` : '';
  
  return `${type}_report_${farmName}${rangeSuffix}_${date}.csv`;
};