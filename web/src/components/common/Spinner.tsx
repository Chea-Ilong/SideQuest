interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className = '', color = '#00d4ff' }: SpinnerProps) {
  return (
    <div
      className={`pixel-spin flex-shrink-0 ${sizeClasses[size]} ${className}`}
      style={{
        borderColor: `${color} transparent transparent transparent`,
        borderStyle: 'solid',
      }}
    />
  );
}
