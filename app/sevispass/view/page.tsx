"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SevisPassCard } from '@/components/sevispass/SevisPassCard';
import { ArrowLeft, AlertCircle } from 'lucide-react';

function SevisPassViewContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sevisPassData, setSevisPassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Check if user has a registered SevisPass
      const response = await fetch('/api/sevispass/user-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.exists && result.data) {
        // User has a registered SevisPass
        setSevisPassData(result.data);
      } else {
        // No SevisPass found - will show the application prompt
        setSevisPassData(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // On error, assume no SevisPass exists
      setSevisPassData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForSevisPass = () => {
    router.push('/sevispass/apply');
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--muted)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--background)',
      position: 'relative'
    }}>
      {/* Theme Toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Back Button */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--foreground)',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card)';
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      {/* Background Pattern */}
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 70%, var(--accent) 0%, transparent 50%)',
        opacity: 0.3,
        zIndex: 1
      }}></div>
      
      <div style={{ 
        position: 'relative',
        zIndex: 2,
        padding: '80px 20px 40px 20px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            background: 'linear-gradient(90deg, #DC2626 0%, #FCD34D 100%)',
            height: '4px',
            width: '80px',
            margin: '0 auto 24px auto',
            borderRadius: '2px'
          }}></div>
          <h1 style={{ 
            fontSize: 'clamp(32px, 5vw, 48px)', 
            fontWeight: '700', 
            color: 'var(--foreground)', 
            margin: '0 0 16px 0',
            letterSpacing: '-0.01em'
          }}>
            My SevisPass
          </h1>
          <p style={{ 
            color: 'var(--muted-foreground)', 
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Your secure digital identity for Papua New Guinea government services
          </p>
        </div>

        {sevisPassData ? (
          <>
            {/* SevisPass Card */}
            <SevisPassCard 
              data={sevisPassData}
              showActions={true}
            />

            {/* Additional Options */}
            <div style={{
              marginTop: '40px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📱</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  Mobile Access
                </h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', marginBottom: '16px' }}>
                  Use facial recognition to access services on mobile
                </p>
                <button
                  onClick={() => router.push('/sevispass/login')}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Test Login
                </button>
              </div>

              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  Verify Others
                </h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', marginBottom: '16px' }}>
                  Scan QR codes to verify other SevisPass holders
                </p>
                <button
                  onClick={() => router.push('/verify')}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--success)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Go to Verify
                </button>
              </div>

              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚙️</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  Update Profile
                </h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', marginBottom: '16px' }}>
                  Update your contact information and settings
                </p>
                <button
                  style={{
                    padding: '8px 16px',
                    background: 'var(--muted)',
                    color: 'var(--muted-foreground)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'not-allowed',
                    fontSize: '14px'
                  }}
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </>
        ) : (
          // No SevisPass Found
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }}>
            <AlertCircle size={64} style={{ color: 'var(--muted-foreground)', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
              No SevisPass Found
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', maxWidth: '400px', margin: '0 auto 32px auto' }}>
              You don't have a SevisPass yet. Apply now to get your secure digital identity for accessing Papua New Guinea government services.
            </p>
            <button
              onClick={handleApplyForSevisPass}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Apply for SevisPass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SevisPassViewPage() {
  return (
    <AuthGuard>
      <SevisPassViewContent />
    </AuthGuard>
  );
}