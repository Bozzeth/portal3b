'use client';

import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css';
import { useEffect, useState } from 'react';
import { User, getAuthenticatedUser } from '@/lib/auth';

Amplify.configure(outputs);

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthWrapperProps) {
  return (
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
            label: 'Phone Number (Optional)',
            placeholder: '+675 12345678',
            required: false,
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
            <div style={{ textAlign: 'center', marginBottom: '32px', background: 'var(--background)', padding: '24px 0' }}>
              <div className="png-flag-accent" style={{ marginBottom: '20px', width: '80px', margin: '0 auto 20px auto' }}></div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                color: 'var(--primary)', 
                margin: '0 0 8px 0',
                letterSpacing: '-0.025em'
              }}>
                SevisPortal
              </h1>
              <p style={{ 
                color: 'var(--muted-foreground)', 
                fontSize: '16px',
                margin: '0',
                fontWeight: '500'
              }}>
                Papua New Guinea Digital Government Platform
              </p>
            </div>
          );
        },
        Footer() {
          return (
            <div>
              <div 
                className="sevispass-login-option"
                onClick={() => {
                  alert('Login with SevisPass - Coming Soon!\n\nThis feature will allow you to authenticate using your existing SevisPass QR code or UIN number.');
                }}
              >
                <h3>🔒 Login with SevisPass</h3>
                <p>Use your existing SevisPass to sign in instantly</p>
              </div>
              
              <div style={{ 
                textAlign: 'center', 
                marginTop: '32px', 
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
          );
        },
        SignIn: {
          Header() {
            return (
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
                  Sign in to SevisPortal
                </h2>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '0' }}>
                  Access your government services and digital identity
                </p>
              </div>
            );
          },
        },
        SignUp: {
          Header() {
            return (
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
                  Create your account
                </h2>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '0' }}>
                  Join Papua New Guinea's digital government platform
                </p>
              </div>
            );
          },
        },
        ResetPassword: {
          Header() {
            return (
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
                  Reset your password
                </h2>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '0' }}>
                  Enter your email to receive a verification code
                </p>
              </div>
            );
          },
        },
      }}
    >
      {children}
    </Authenticator>
  );
}

export function useAuth() {
  const { user: amplifyUser, signOut } = useAuthenticator((context) => [context.user]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (amplifyUser) {
        const userData = await getAuthenticatedUser();
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    loadUser();
  }, [amplifyUser]);

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}