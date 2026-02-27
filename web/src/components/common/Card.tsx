import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className = '', padding = 'md', onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-slate-200 shadow-sm
        ${paddingClasses[padding]}
        ${hoverable ? 'cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all duration-150' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
