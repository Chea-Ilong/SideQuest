import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export function PageContainer({ children, className = '', maxWidth = '7xl' }: PageContainerProps) {
  return (
    <main className={`${maxWidthClasses[maxWidth]} mx-auto px-4 md:px-6 py-8 ${className}`}>
      {children}
    </main>
  );
}
