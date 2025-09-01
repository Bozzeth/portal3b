"use client";

import { useState } from 'react';
import { signIn, signUp, confirmSignUp, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

type AuthMode = 'signIn' | 'signUp' | 'confirmSignUp' | 'forgotPassword' | 'confirmReset';

interface CustomAuthProps {
  onSuccess?: () => void;
}

export function CustomAuth({ onSuccess }: CustomAuthProps) {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    confirmationCode: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+675\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const { isSignedIn } = await signIn({
        username: formData.email,
        password: formData.password,
      });

      if (isSignedIn) {
        onSuccess?.();
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }
      if (!validatePassword(formData.password)) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (!validatePhoneNumber(formData.phoneNumber)) {
        throw new Error('Phone number must be in format +675xxxxxxxx');
      }

      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            given_name: formData.firstName,
            family_name: formData.lastName,
            phone_number: formData.phoneNumber,
          },
        },
      });

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setMode('confirmSignUp');
        setMessage('Please check your email for a confirmation code');
      } else if (isSignUpComplete) {
        setMessage('Account created successfully! Please sign in.');
        setMode('signIn');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: formData.email,
        confirmationCode: formData.confirmationCode,
      });

      if (isSignUpComplete) {
        setMessage('Account confirmed successfully! Please sign in.');
        setMode('signIn');
        setFormData(prev => ({ ...prev, confirmationCode: '' }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm account');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const output = await resetPassword({ username: formData.email });
      setMode('confirmReset');
      setMessage('Please check your email for a reset code');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validatePassword(formData.password)) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await confirmResetPassword({
        username: formData.email,
        confirmationCode: formData.confirmationCode,
        newPassword: formData.password,
      });

      setMessage('Password reset successfully! Please sign in with your new password.');
      setMode('signIn');
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
        confirmationCode: ''
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderSignIn = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
          Sign in to SevisPortal
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '0' }}>
          Access your government services and digital identity
        </p>
      </div>

      <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(31, 41, 55, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter your password"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(31, 41, 55, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: loading ? '#9CA3AF' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            transform: loading ? 'none' : 'translateY(0)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#374151';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button
          onClick={() => setMode('forgotPassword')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Forgot your password?
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <span style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
          Don't have an account?{' '}
        </span>
        <button
          onClick={() => setMode('signUp')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Create account
        </button>
      </div>
    </div>
  );

  const renderSignUp = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
          Create your account
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '0' }}>
          Join Papua New Guinea's digital government platform
        </p>
      </div>

      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter your first name"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '16px',
                background: 'var(--input)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter your last name"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '16px',
                background: 'var(--input)',
                color: 'var(--foreground)'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            placeholder="+675 12345678"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Create a secure password"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Confirm Password
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm your password"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: loading ? '#9CA3AF' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <span style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
          Already have an account?{' '}
        </span>
        <button
          onClick={() => setMode('signIn')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  );

  const renderConfirmSignUp = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
          Confirm your account
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '0' }}>
          Enter the confirmation code sent to {formData.email}
        </p>
      </div>

      <form onSubmit={handleConfirmSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Confirmation Code
          </label>
          <input
            type="text"
            value={formData.confirmationCode}
            onChange={(e) => handleInputChange('confirmationCode', e.target.value)}
            placeholder="Enter confirmation code"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: loading ? '#9CA3AF' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Confirming...' : 'Confirm Account'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button
          onClick={() => setMode('signIn')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );

  const renderForgotPassword = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
          Reset your password
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '0' }}>
          Enter your email to receive a verification code
        </p>
      </div>

      <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: loading ? '#9CA3AF' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Sending Code...' : 'Send Reset Code'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button
          onClick={() => setMode('signIn')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );

  const renderConfirmReset = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
          Set new password
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: '0' }}>
          Enter the code sent to {formData.email} and your new password
        </p>
      </div>

      <form onSubmit={handleConfirmReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Verification Code
          </label>
          <input
            type="text"
            value={formData.confirmationCode}
            onChange={(e) => handleInputChange('confirmationCode', e.target.value)}
            placeholder="Enter verification code"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            New Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter your new password"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--foreground)', marginBottom: '6px' }}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Confirm your new password"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: loading ? '#9CA3AF' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <button
          onClick={() => setMode('signIn')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Back to Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: '16px',
      padding: '40px',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--border)'
    }}>
      {error && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.5)',
          color: '#DC2626',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.5)',
          color: '#22C55E',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {mode === 'signIn' && renderSignIn()}
      {mode === 'signUp' && renderSignUp()}
      {mode === 'confirmSignUp' && renderConfirmSignUp()}
      {mode === 'forgotPassword' && renderForgotPassword()}
      {mode === 'confirmReset' && renderConfirmReset()}
    </div>
  );
}