import React from 'react';

/**
 * Vibrant Badge / Chip component
 */
export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    accent: 'bg-orange-50 text-orange-700 border-orange-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/80',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    accent: 'bg-orange-500',
    purple: 'bg-purple-500',
    sky: 'bg-sky-500',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-bold',
    md: 'text-xs px-3 py-1 font-bold',
    lg: 'text-sm px-3.5 py-1.5 font-extrabold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-current'} animate-pulse`} />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
