import React from 'react';

/**
 * Colorful & accessible Button component
 * Variants: primary, accent, success, secondary, outline, ghost
 * Sizes: sm, md, lg
 */
export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-bold',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white focus:ring-indigo-500 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30',
    accent: 'bg-gradient-to-r from-tangerine-500 via-orange-500 to-amber-500 hover:from-tangerine-600 hover:to-amber-600 text-white focus:ring-amber-500 shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35',
    success: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white focus:ring-emerald-500 shadow-md shadow-emerald-600/20',
    secondary: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 active:bg-indigo-200 focus:ring-indigo-300 border border-indigo-100',
    outline: 'border-2 border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50/50 hover:border-indigo-400 active:bg-indigo-100 focus:ring-indigo-300',
    ghost: 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 active:bg-indigo-100 focus:ring-indigo-300',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
};

export default Button;
