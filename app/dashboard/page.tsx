"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AuthGuard } from '@/components/auth/AuthGuard';

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        console.log('Dashboard user object:', currentUser);
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user in dashboard:', error);
        // AuthGuard will handle redirect
      }
    };
    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Theme Toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Header */}
      <header style={{ 
        background: 'var(--card)', 
        borderBottom: '1px solid var(--border)',
        padding: '20px 0'
      }}>
        <div className="container">
          <div className="dashboard-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ 
                background: 'linear-gradient(90deg, #DC2626 0%, #FCD34D 100%)',
                height: '4px',
                width: '60px',
                marginBottom: '12px',
                borderRadius: '2px'
              }}></div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
                SevisPortal Dashboard
              </h1>
              <p style={{ color: 'var(--muted-foreground)', margin: '0' }}>
                Papua New Guinea Digital Government Platform
              </p>
            </div>
            
            <div className="user-info" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              flexWrap: 'wrap',
              justifyContent: 'flex-end'
            }}>
              {user && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '500', margin: '0', fontSize: '14px' }}>
                    {(user && (user.signInDetails?.loginId || user.username || user.userId)) || 'Authenticated User'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0' }}>
                    Authenticated
                  </p>
                </div>
              )}
              
              <button
                onClick={handleSignOut}
                style={{
                  background: 'var(--destructive)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
              Welcome to SevisPortal!
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
              You have successfully authenticated. This is a protected dashboard page.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px',
            marginBottom: '40px'
          }}>
            {/* Services Cards */}
            {[
              {
                title: 'My SevisPass',
                description: 'View and manage your PNG digital identity card',
                link: '/sevispass/view',
                available: true
              },
              {
                title: 'SevisPass Application',
                description: 'Apply for your PNG digital identity with automated verification',
                link: '/sevispass/apply',
                available: true
              },
              {
                title: 'CityPass Application', 
                description: 'Port Moresby resident credentials and city services',
                link: '/citypass/apply',
                available: false
              },
              {
                title: 'Medical Record Number',
                description: 'Health service identifier for PNG healthcare system', 
                link: '/health/mrn/apply',
                available: false
              },
              {
                title: 'SIM Card Registration',
                description: 'eKYC and registration for PNG telecom providers',
                link: '/nicta/sim/register',
                available: false
              },
              {
                title: 'Identity Verification',
                description: 'QR code and UIN/VID verification service',
                link: '/verify',
                available: true
              },
              {
                title: 'Vouching System',
                description: 'Personal vouching for residents',
                link: '/resident/vouch',
                available: false
              }
            ].map((service, index) => (
              <div
                key={index}
                style={{
                  background: 'var(--card)',
                  border: service.available ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  opacity: service.available ? 1 : 0.7
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => {
                  if (service.available) {
                    router.push(service.link);
                  } else {
                    alert(`${service.title} - Page will be implemented soon!`);
                  }
                }}
              >
                {service.available && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    textTransform: 'uppercase'
                  }}>
                    Available
                  </div>
                )}
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  {service.title}
                </h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', lineHeight: 1.5 }}>
                  {service.description}
                </p>
                {service.available && (
                  <div style={{
                    marginTop: '12px',
                    color: 'var(--primary)',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    🚀 Ready to use
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Back to Home */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <a 
              href="/"
              style={{ 
                color: 'var(--primary)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}