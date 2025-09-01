"use client";

import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CustomAuth } from '@/components/auth/CustomAuth';

// Ensure configuration is applied properly
if (typeof window !== 'undefined') {
  try {
    const config = Amplify.getConfig();
    if (!config.Auth?.Cognito?.userPoolId) {
      console.log('Re-applying Amplify configuration in auth page');
      Amplify.configure(outputs);
    }
  } catch (error) {
    console.error('Error configuring Amplify in auth page:', error);
    Amplify.configure(outputs);
  }
} else {
  Amplify.configure(outputs);
}

export default function AuthPage() {
  const router = useRouter();
  const [showSevisLogin, setShowSevisLogin] = useState(false);
  const [uin, setUin] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        router.push('/dashboard');
      } catch (error) {
        // User not authenticated, stay on auth page
      }
    };

    checkAuth();
  }, [router]);

  const handleSevisPassLogin = () => {
    setShowSevisLogin(true);
  };

  const handleUinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uin.trim()) {
      alert(`Future: Opening camera for facial verification with UIN: ${uin}`);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--background)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      {/* Theme Toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Subtle Background Pattern */}
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
        width: '100%', 
        maxWidth: '480px',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            background: 'linear-gradient(90deg, #DC2626 0%, #FCD34D 100%)',
            height: '4px',
            width: '80px',
            margin: '0 auto 20px auto',
            borderRadius: '2px'
          }}></div>
          <h1 style={{ 
            fontSize: 'clamp(28px, 5vw, 36px)', 
            fontWeight: '700', 
            color: 'var(--foreground)', 
            margin: '0 0 8px 0',
            letterSpacing: '-0.01em'
          }}>
            SevisPortal
          </h1>
          <p style={{ 
            color: 'var(--muted-foreground)', 
            fontSize: '16px',
            margin: '0',
            fontWeight: '400'
          }}>
            Papua New Guinea Digital Government Platform
          </p>
        </div>

        {/* Auth Component */}
        <CustomAuth onSuccess={() => router.push('/dashboard')} />

        {/* SevisPass Login */}
        <button
          onClick={handleSevisPassLogin}
          style={{ 
            background: 'transparent', 
            border: `1px solid var(--border)`,
            color: 'var(--foreground)',
            fontSize: '16px',
            padding: '14px 24px',
            fontWeight: '500',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
            maxWidth: '100%'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          Login with SevisPass
        </button>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
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
          
          <div style={{ 
            marginTop: '24px', 
            padding: '24px 0',
            borderTop: '1px solid var(--border)'
          }}>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0 0 4px 0' }}>
              © 2025 Government of Papua New Guinea
            </p>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0' }}>
              Department of Information and Communications Technology
            </p>
          </div>
        </div>
      </div>

      {/* SevisPass Login Modal */}
      {showSevisLogin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--card)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: 'var(--foreground)' }}>
              Login with SevisPass
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '32px' }}>
              Enter your UIN for facial verification
            </p>
            
            <form onSubmit={handleUinSubmit}>
              <input
                type="text"
                placeholder="Enter your UIN"
                value={uin}
                onChange={(e) => setUin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  marginBottom: '24px',
                  background: 'var(--input)',
                  color: 'var(--foreground)'
                }}
              />
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowSevisLogin(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: '2px solid var(--border)',
                    borderRadius: '12px',
                    background: 'transparent',
                    color: 'var(--foreground)',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}