"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LogoInline } from '@/components/ui/Logo';
import { getSevisPassSession, clearSevisPassSession, hasValidSevisPassSession } from '@/lib/services/sevispass-auth-service';

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try Cognito first
        const currentUser = await getCurrentUser();
        console.log('Dashboard user object (Cognito):', currentUser);
        setUser({ ...currentUser, authMethod: 'cognito' });
      } catch (error) {
        // If Cognito fails, check SevisPass
        console.log('No Cognito user, checking SevisPass session...');
        
        if (hasValidSevisPassSession()) {
          const sevisPassSession = getSevisPassSession();
          if (sevisPassSession) {
            console.log('Dashboard user object (SevisPass):', sevisPassSession);
            const sevisUser = {
              username: sevisPassSession.uin,
              userId: sevisPassSession.cognitoUserId,
              attributes: {
                name: sevisPassSession.userFullName,
                uin: sevisPassSession.uin
              },
              authMethod: 'sevispass',
              sevisPassSession
            };
            setUser(sevisUser);
          }
        }
      }
    };
    loadUser();
  }, []);

  const handleSignOut = async () => {
    try {
      if (user?.authMethod === 'sevispass') {
        // SevisPass logout
        console.log('🚪 SevisPass user signing out...');
        clearSevisPassSession();
        router.push('/');
      } else {
        // Cognito logout
        console.log('🚪 Cognito user signing out...');
        await signOut();
        router.push('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Clear any sessions and redirect anyway
      clearSevisPassSession();
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ marginBottom: '8px' }}>
                <LogoInline size="medium" showText={true} variant="horizontal" solidYellow={true} />
              </div>
              <p style={{ 
                color: 'var(--muted-foreground)', 
                margin: '0',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Papua New Guinea Digital Government Services
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
                    {user.authMethod === 'sevispass' 
                      ? user.attributes?.name || user.username
                      : (user.signInDetails?.loginId || user.username || user.userId) || 'Authenticated User'
                    }
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0' }}>
                    {user.authMethod === 'sevispass' 
                      ? `SevisPass • ${user.attributes?.uin}` 
                      : 'Authenticated'
                    }
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
              Welcome to Sevis Portal!
            </h2>
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
                title: 'My CityPass',
                description: 'View and manage your Port Moresby resident credentials',
                link: '/citypass/view',
                available: true
              },
              {
                title: 'Statement of School Results',
                description: 'Access and verify academic records and certificates',
                link: '/education/results',
                available: false
              },
              {
                title: 'CityPass Admin',
                description: 'Review and approve CityPass applications',
                link: '/admin/citypass',
                available: true
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