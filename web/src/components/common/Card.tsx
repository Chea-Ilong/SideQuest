import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClasses = {
  default: 'bg-white border border-slate-200 shadow-sm',
  elevated: 'bg-white border border-slate-100 shadow-md',
  bordered: 'bg-white border-2 border-slate-200',
  glass: 'glass-card shadow-sm',
};

export function Card({ children, className = '', padding = 'md', onClick, hoverable, variant = 'default' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverable ? 'cursor-pointer hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
