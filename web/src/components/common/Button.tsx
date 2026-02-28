import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#4a3f8f] text-[#f0f0f0] border-[#7b6fcf] hover:bg-[#5a4f9f] active:translate-y-[2px] active:shadow-none',
  secondary: 'bg-[#1a1a2e] text-[#c8c8c8] border-[#4a3f8f] hover:bg-[#22223e] hover:text-[#f0f0f0] active:translate-y-[2px] active:shadow-none',
  ghost: 'bg-transparent text-[#888888] border-[#333355] hover:bg-[#1a1a2e] hover:text-[#c8c8c8] active:translate-y-[2px] active:shadow-none',
  danger: 'bg-[#aa0022] text-[#f0f0f0] border-[#ff2244] hover:bg-[#cc0033] active:translate-y-[2px] active:shadow-none',
  gradient: 'bg-[#4a3f8f] text-[#00d4ff] border-[#00d4ff] hover:bg-[#5a4f9f] hover:text-[#ffffff] active:translate-y-[2px] active:shadow-none',
  success: 'bg-[#006633] text-[#00ff88] border-[#00ff88] hover:bg-[#008844] active:translate-y-[2px] active:shadow-none',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-xs gap-2',
  lg: 'px-6 py-3 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  icon,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        font-[Silkscreen,monospace] uppercase tracking-wider
        border-2 transition-all duration-75
        shadow-[2px_2px_0_#000000]
        focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:ring-offset-2 focus:ring-offset-[#0a0a1a]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="pixel-spin inline-block w-3 h-3 border-2 border-current border-t-transparent flex-shrink-0" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
