"use client";

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'hero';
  showText?: boolean;
  variant?: 'horizontal' | 'stacked';
  className?: string;
  solidYellow?: boolean;
}

export function Logo({ 
  size = 'medium', 
  showText = true, 
  variant = 'horizontal',
  className = '' 
}: LogoProps) {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12', 
    large: 'h-16 w-16',
    hero: 'h-24 w-24'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl',
    hero: 'text-5xl'
  };

  return (
    <div className={`flex items-center ${variant === 'stacked' ? 'flex-col' : 'flex-row'} ${className}`}>
      <img 
        src="/logos/sevislogo.png" 
        alt="Sevis Portal Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
      
      {showText && (
        <span 
          className={`
            ${textSizeClasses[size]} 
            font-bold 
            ${variant === 'horizontal' ? 'ml-3' : 'mt-2'}
            bg-gradient-to-r from-golden-brown to-jonquil bg-clip-text text-transparent
          `}
          style={{
            backgroundImage: 'var(--brand-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Sevis Portal
        </span>
      )}
    </div>
  );
}

// Inline styles version for components that don't use Tailwind
export function LogoInline({ 
  size = 'medium', 
  showText = true, 
  variant = 'horizontal',
  style = {},
  solidYellow = false 
}: LogoProps & { style?: React.CSSProperties }) {
  const sizeMap = {
    small: { width: '32px', height: '32px' },
    medium: { width: '48px', height: '48px' },
    large: { width: '64px', height: '64px' },
    hero: { width: '128px', height: '128px' }
  };

  const textSizeMap = {
    small: '18px',
    medium: '24px', 
    large: '30px',
    hero: '48px'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexDirection: variant === 'stacked' ? 'column' : 'row',
      ...style
    }}>
      <img 
        src="/logos/sevislogo.png" 
        alt="Sevis Portal Logo" 
        style={{
          ...sizeMap[size],
          objectFit: 'contain'
        }}
      />
      
      {showText && (
        <span style={{
          fontSize: textSizeMap[size],
          fontWeight: 'bold',
          marginLeft: variant === 'horizontal' ? '12px' : '0',
          marginTop: variant === 'stacked' ? '8px' : '0',
          ...(solidYellow ? {
            color: '#F0CA0C'
          } : {
            background: 'var(--brand-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          })
        }}>
          Sevis Portal
        </span>
      )}
    </div>
  );
}