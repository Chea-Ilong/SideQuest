import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'elevated' | 'bordered' | 'glass' | 'bright' | 'dark';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

const variantClasses = {
  default: 'bg-[#12122a] border-2 border-[#4a3f8f] shadow-[4px_4px_0_#000000]',
  elevated: 'bg-[#12122a] border-2 border-[#7b6fcf] shadow-[4px_4px_0_#000000]',
  bordered: 'bg-[#0a0a1a] border-2 border-[#333355] shadow-[4px_4px_0_#000000]',
  glass: 'bg-[#0a0a1a] border-2 border-[#4a3f8f] shadow-[4px_4px_0_#000000]',
  bright: 'bg-[#0a1a2a] border-2 border-[#00d4ff] shadow-[4px_4px_0_#000000,0_0_12px_rgba(0,212,255,0.2)]',
  dark: 'bg-[#050510] border-2 border-[#222244] shadow-[4px_4px_0_#000000]',
};

export function Card({ children, className = '', padding = 'md', onClick, hoverable, variant = 'default' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverable ? 'cursor-pointer hover:border-[#00d4ff] hover:shadow-[4px_4px_0_#000000,0_0_8px_rgba(0,212,255,0.2)] transition-all duration-75' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
