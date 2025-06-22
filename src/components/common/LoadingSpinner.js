import React from 'react';
import clsx from 'clsx';

const LoadingSpinner = ({
  size = 'md',
  color = 'primary',
  text,
  centered = false,
  overlay = false,
  className,
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'border-primary',
    white: 'border-white',
    gray: 'border-gray-500',
    green: 'border-green-500',
    blue: 'border-blue-500',
    red: 'border-red-500',
  };

  const spinnerClasses = clsx(
    'animate-spin rounded-full border-2 border-solid border-t-transparent',
    sizeClasses[size],
    colorClasses[color],
    className
  );

  const containerClasses = clsx(
    'flex items-center justify-center',
    {
      'min-h-screen': centered,
      'fixed inset-0 bg-black bg-opacity-50 z-50': overlay,
      'flex-col gap-2': text,
    }
  );

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  if (overlay) {
    return (
      <div className={containerClasses}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4">
          <div className={spinnerClasses} />
          {text && (
            <p className={clsx('text-gray-700 dark:text-gray-300', textSizeClasses[size])}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses} />
      {text && (
        <p className={clsx('text-gray-700 dark:text-gray-300', textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
};

// Loading skeleton component
export const LoadingSkeleton = ({ 
  width = 'w-full', 
  height = 'h-4', 
  rounded = 'rounded',
  className 
}) => {
  return (
    <div 
      className={clsx(
        'skeleton bg-gray-200 dark:bg-gray-700 animate-pulse',
        width,
        height,
        rounded,
        className
      )}
    />
  );
};

// Loading card skeleton
export const LoadingCard = ({ lines = 3 }) => {
  return (
    <div className="card p-6 space-y-4">
      <LoadingSkeleton height="h-6" width="w-3/4" />
      {Array.from({ length: lines }).map((_, index) => (
        <LoadingSkeleton 
          key={index} 
          height="h-4" 
          width={index === lines - 1 ? 'w-2/3' : 'w-full'} 
        />
      ))}
    </div>
  );
};

// Loading table skeleton
export const LoadingTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <LoadingSkeleton key={`header-${index}`} height="h-6" width="w-full" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          className="grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              height="h-4" 
              width="w-full" 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Loading button
export const LoadingButton = ({ children, loading, ...props }) => {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading && <LoadingSpinner size="sm" color="white" className="mr-2" />}
      {children}
    </button>
  );
};

export default LoadingSpinner;