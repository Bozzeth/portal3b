"use client";

import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { CustomAuth } from '../../components/auth/CustomAuth';
import { SevisPassRegistration } from '../../components/sevispass/SevisPassRegistration';
import { LogoInline } from '../../components/ui/Logo';

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

type AuthView = 'main' | 'sevispass_register';

export default function AuthPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<AuthView>('main');

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

  const handleSevisPassRegister = () => {
    setCurrentView('sevispass_register');
  };

  const handleSevisPassSuccess = (userData: { uin: string; fullName?: string }) => {
    console.log('SevisPass authentication successful:', userData);
    router.push('/dashboard');
  };

  const handleSevisPassRegistrationComplete = (data: { uin: string; status: 'approved' | 'pending' | 'rejected' }) => {
    console.log('SevisPass registration completed:', data);
    if (data.status === 'approved') {
      alert(`SevisPass approved! Your UIN is: ${data.uin}`);
      setCurrentView('main');
    } else if (data.status === 'pending') {
      alert(`Application submitted for review. Application ID: ${data.uin}`);
      setCurrentView('main');
    } else {
      alert('Registration was rejected. Please try again with better quality images.');
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
        maxWidth: currentView === 'main' ? '480px' : '600px',
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Render different views */}
        {currentView === 'main' && (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '20px' }}>
                <LogoInline size="large" showText={true} variant="stacked" />
              </div>
              <p style={{ 
                color: 'var(--muted-foreground)', 
                fontSize: '16px',
                margin: '0',
                fontWeight: '500'
              }}>
                Papua New Guinea Digital Government Services
              </p>
            </div>

            {/* Auth Component */}
            <CustomAuth onSuccess={() => router.push('/dashboard')} />


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
          </>
        )}


        {currentView === 'sevispass_register' && (
          <SevisPassRegistration
            onComplete={handleSevisPassRegistrationComplete}
            onCancel={() => setCurrentView('main')}
          />
        )}
      </div>

    </div>
  );
}