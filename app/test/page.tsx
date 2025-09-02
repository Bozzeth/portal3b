"use client";

import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Ensure configuration is applied properly
if (typeof window !== 'undefined') {
  try {
    const config = Amplify.getConfig();
    if (!config.Auth?.Cognito?.userPoolId) {
      console.log('Re-applying Amplify configuration in test page');
      Amplify.configure(outputs);
    }
  } catch (error) {
    console.error('Error configuring Amplify in test page:', error);
    Amplify.configure(outputs);
  }
} else {
  Amplify.configure(outputs);
}

export default function TestPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        console.log('User already authenticated, redirecting to dashboard');
        router.push('/dashboard');
      } catch (error) {
        console.log('User not authenticated, staying on test page');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--background)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
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
            Test Page - Original Authenticator
          </h1>
          <p style={{ 
            color: 'var(--muted-foreground)', 
            fontSize: '16px',
            margin: '0',
            fontWeight: '400'
          }}>
            Compare this with /auth to debug email verification
          </p>
        </div>

        {/* Original Authenticator Component */}
        <div style={{ 
          width: '100%',
          background: 'var(--card)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border)'
        }}>
          <Authenticator
            formFields={{
              signUp: {
                given_name: {
                  label: 'First Name',
                  placeholder: 'Enter your first name',
                  required: true,
                  order: 1,
                },
                family_name: {
                  label: 'Last Name',
                  placeholder: 'Enter your last name',
                  required: true,
                  order: 2,
                },
                email: {
                  label: 'Email Address',
                  placeholder: 'Enter your email address',
                  required: true,
                  order: 3,
                },
                phone_number: {
                  label: 'Phone Number',
                  placeholder: '+675 12345678',
                  required: true,
                  order: 4,
                },
                password: {
                  label: 'Password',
                  placeholder: 'Create a secure password',
                  required: true,
                  order: 5,
                },
                confirm_password: {
                  label: 'Confirm Password',
                  placeholder: 'Confirm your password',
                  required: true,
                  order: 6,
                },
              },
              signIn: {
                username: {
                  label: 'Email Address',
                  placeholder: 'Enter your email address',
                },
                password: {
                  label: 'Password',
                  placeholder: 'Enter your password',
                },
              },
              resetPassword: {
                username: {
                  label: 'Email Address',
                  placeholder: 'Enter your email address',
                },
              },
              confirmResetPassword: {
                confirmation_code: {
                  label: 'Verification Code',
                  placeholder: 'Enter verification code',
                },
                password: {
                  label: 'New Password',
                  placeholder: 'Enter your new password',
                },
                confirm_password: {
                  label: 'Confirm New Password',
                  placeholder: 'Confirm your new password',
                },
              },
            }}
            components={{
              Header() {
                return (
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '20px', 
                      fontWeight: '600', 
                      color: 'var(--foreground)', 
                      margin: '0 0 8px 0' 
                    }}>
                      Original Authenticator
                    </h3>
                    <p style={{ 
                      color: 'var(--muted-foreground)', 
                      fontSize: '14px', 
                      margin: '0' 
                    }}>
                      This should send verification emails
                    </p>
                  </div>
                );
              },
            }}
          >
            {({ signOut, user }) => {
              if (user) {
                console.log('✅ Original Authenticator - User authenticated:', user);
                return (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px',
                    color: 'var(--foreground)'
                  }}>
                    <h3 style={{ marginBottom: '16px' }}>✅ Authentication Successful!</h3>
                    <p style={{ marginBottom: '20px', color: 'var(--muted-foreground)' }}>
                      User: {user.signInDetails?.loginId || user.username || 'Authenticated User'}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => router.push('/dashboard')}
                        style={{
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Go to Dashboard
                      </button>
                      <button
                        onClick={signOut}
                        style={{
                          background: 'transparent',
                          color: 'var(--destructive)',
                          border: '1px solid var(--destructive)',
                          padding: '12px 24px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          </Authenticator>
        </div>

        {/* Navigation */}
        <div style={{ textAlign: 'center', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a 
            href="/auth"
            style={{ 
              color: 'var(--primary)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              padding: '8px 16px',
              border: '1px solid var(--primary)',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--primary)';
            }}
          >
            Compare with Custom Auth (/auth)
          </a>
          <a 
            href="/"
            style={{ 
              color: 'var(--muted-foreground)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Back to Home
          </a>
        </div>

        {/* Debug Info */}
        <div style={{
          background: 'var(--muted)',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: 'var(--muted-foreground)',
          width: '100%',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <strong>Debug Info:</strong><br/>
          • Open browser console to see logs<br/>
          • Try signing up with both pages<br/>
          • Check which one sends verification emails<br/>
          • Compare the network requests in DevTools
        </div>
      </div>
    </div>
  );
}