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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {user && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '500', margin: '0' }}>
                    {(user && (user.signInDetails?.loginId || user.username || user.userId)) || 'Authenticated User'}
                  </p>
                  <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: '0' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Services Cards */}
            {[
              {
                title: 'SevisPass Application',
                description: 'Apply for your PNG digital identity with automated verification',
                link: '/sevispass/apply'
              },
              {
                title: 'CityPass Application', 
                description: 'Port Moresby resident credentials and city services',
                link: '/citypass/apply'
              },
              {
                title: 'Medical Record Number',
                description: 'Health service identifier for PNG healthcare system', 
                link: '/health/mrn/apply'
              },
              {
                title: 'SIM Card Registration',
                description: 'eKYC and registration for PNG telecom providers',
                link: '/nicta/sim/register'
              },
              {
                title: 'Identity Verification',
                description: 'QR code and UIN/VID verification service',
                link: '/verify'
              },
              {
                title: 'Vouching System',
                description: 'Personal vouching for residents',
                link: '/resident/vouch'
              }
            ].map((service, index) => (
              <div
                key={index}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
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
                  // For now, just alert since these pages don't exist yet
                  alert(`Navigating to ${service.title} - Page will be implemented soon!`);
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  {service.title}
                </h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', lineHeight: 1.5 }}>
                  {service.description}
                </p>
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