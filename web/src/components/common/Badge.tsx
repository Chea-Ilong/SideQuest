import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: BadgeSize;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#1a1a2e] text-[#888888] border-[#333355]',
  success: 'bg-[#003322] text-[#00ff88] border-[#00aa55]',
  warning: 'bg-[#332200] text-[#ffd700] border-[#aa7700]',
  error: 'bg-[#330011] text-[#ff2244] border-[#aa0022]',
  info: 'bg-[#0a1a2a] text-[#00d4ff] border-[#0088aa]',
  purple: 'bg-[#1a0a2a] text-[#bf7fff] border-[#7b2d8b]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#888888]',
  success: 'bg-[#00ff88]',
  warning: 'bg-[#ffd700]',
  error: 'bg-[#ff2244]',
  info: 'bg-[#00d4ff]',
  purple: 'bg-[#bf7fff]',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
};

export function Badge({ children, variant = 'default', className = '', size = 'sm', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-[Silkscreen,monospace] uppercase tracking-wider shadow-[1px_1px_0_#000000] ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 flex-shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
