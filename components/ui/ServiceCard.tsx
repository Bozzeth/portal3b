"use client";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  category: string;
  status?: 'available' | 'coming_soon' | 'maintenance';
}

export function ServiceCard({ 
  title, 
  description, 
  icon, 
  href, 
  category,
  status = 'available' 
}: ServiceCardProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'available':
        return { color: '#10B981', label: 'Available', dot: '🟢' };
      case 'coming_soon':
        return { color: '#F59E0B', label: 'Coming Soon', dot: '🟡' };
      case 'maintenance':
        return { color: '#EF4444', label: 'Maintenance', dot: '🔴' };
      default:
        return { color: '#10B981', label: 'Available', dot: '🟢' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="service-card">
      <a href={href} style={{ textDecoration: 'none' }}>
        <div 
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--border-radius)',
            padding: '24px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.25)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          {/* Category Badge */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--accent)',
            color: 'var(--muted-foreground)',
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {category}
          </div>

          {/* Icon */}
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {icon}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--foreground)',
              marginBottom: '8px',
              lineHeight: '1.3'
            }}>
              {title}
            </h3>
            
            <p style={{
              fontSize: '14px',
              color: 'var(--muted-foreground)',
              lineHeight: '1.5',
              margin: '0'
            }}>
              {description}
            </p>
          </div>

          {/* Status */}
          <div style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusInfo.color
            }}></div>
            <span style={{
              fontSize: '12px',
              color: 'var(--muted-foreground)',
              fontWeight: '500'
            }}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}