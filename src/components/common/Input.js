import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({
  label,
  error,
  success,
  hint,
  required = false,
  disabled = false,
  fullWidth = true,
  size = 'md',
  type = 'text',
  className,
  containerClassName,
  id,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  ...props
}, ref) => {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseClasses = 'block border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const stateClasses = {
    default: 'border-gray-300 focus:border-primary focus:ring-primary',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
  };

  const getStateClass = () => {
    if (error) return stateClasses.error;
    if (success) return stateClasses.success;
    return stateClasses.default;
  };

  const inputClasses = clsx(
    baseClasses,
    sizeClasses[size],
    getStateClass(),
    {
      'w-full': fullWidth,
      'bg-gray-50': disabled,
    },
    className
  );

  const containerClasses = clsx(
    'space-y-1',
    containerClassName
  );

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
        required={required}
        {...props}
      />
      
      {hint && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
      
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {success && (
        <p className="text-xs text-green-600 dark:text-green-400">
          {success}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;