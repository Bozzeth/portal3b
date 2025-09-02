"use client";

import { ServiceCard } from "@/components/ui/ServiceCard";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  category: string;
  status?: 'available' | 'coming_soon' | 'maintenance';
}

const services: Service[] = [
  {
    id: 'sevispass',
    title: 'SevisPass Application',
    description: 'Apply for your digital identity document and access government services securely.',
    icon: '🆔',
    href: '/sevispass/apply',
    category: 'Identity',
    status: 'available'
  },
  {
    id: 'citypass',
    title: 'CityPass Application',
    description: 'Get your city access pass for urban services and transportation.',
    icon: '🏙️',
    href: '/citypass/apply',
    category: 'Urban',
    status: 'available'
  },
  {
    id: 'medical-record',
    title: 'Medical Record Number',
    description: 'Register for your unique medical record number for healthcare services.',
    icon: '🏥',
    href: '/health/mrn/apply',
    category: 'Health',
    status: 'available'
  },
  {
    id: 'sim-registration',
    title: 'SIM Registration',
    description: 'Register your SIM card with NICTA for telecommunications compliance.',
    icon: '📱',
    href: '/nicta/sim/register',
    category: 'Telecom',
    status: 'available'
  },
  {
    id: 'identity-verification',
    title: 'Identity Verification',
    description: 'Verify your identity for secure access to government digital services.',
    icon: '🔐',
    href: '/verify',
    category: 'Security',
    status: 'available'
  }
];

export function ServicesSection() {
  return (
    <section id="services" style={{ 
      padding: '80px 0',
      background: 'var(--background)',
      position: 'relative'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 70% 30%, var(--accent) 0%, transparent 50%)',
        opacity: 0.3,
        zIndex: 1
      }}></div>

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            background: 'linear-gradient(90deg, #F59E0B 0%, #FCD34D 100%)',
            height: '4px',
            width: '60px',
            margin: '0 auto 24px auto',
            borderRadius: '2px'
          }}></div>
          
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '700',
            color: '#B91C1C',
            background: 'linear-gradient(135deg, #B91C1C 0%, #F59E0B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px',
            letterSpacing: '-0.01em'
          }}>
            Government Services
          </h2>
          
          <p style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            color: 'var(--muted-foreground)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Access essential government services through our secure digital platform
          </p>
        </div>

        {/* Services Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '60px'
        }}>
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              description={service.description}
              icon={service.icon}
              href={service.href}
              category={service.category}
              status={service.status}
            />
          ))}
        </div>

        {/* Help Section */}
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'var(--card)',
          borderRadius: 'var(--border-radius)',
          border: '1px solid var(--border)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#B91C1C',
            marginBottom: '12px'
          }}>
            Need Help?
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--muted-foreground)',
            marginBottom: '24px',
            maxWidth: '400px',
            margin: '0 auto 24px auto'
          }}>
            Our support team is here to assist you with any questions about government services.
          </p>
          <a 
            href="/help" 
            className="btn-primary"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Get Help
          </a>
        </div>
      </div>
    </section>
  );
}