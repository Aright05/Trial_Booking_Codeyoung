import React from 'react';

/**
 * Reusable Card component
 */
export const Card = ({
  children,
  className = '',
  header,
  footer,
  bordered = true,
  hoverable = false,
  padding = 'normal',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-card transition-all duration-200 ${
        bordered ? 'border border-slate-200/80' : ''
      } ${
        hoverable ? 'hover:shadow-card-hover hover:border-slate-300' : ''
      } ${className}`}
      {...props}
    >
      {header && (
        <div className="border-b border-slate-100 px-6 py-4">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
