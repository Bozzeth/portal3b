"use client";

import { useState, useRef, useCallback } from 'react';
import { Camera, Eye } from 'lucide-react';

interface SevisPassLoginProps {
  onSuccess?: (userData: { uin: string; fullName: string }) => void;
  onCancel?: () => void;
}

type LoginStep = 'uin_entry' | 'face_capture' | 'processing' | 'success' | 'failed';

export function SevisPassLogin({ onSuccess, onCancel }: SevisPassLoginProps) {
  const [step, setStep] = useState<LoginStep>('uin_entry');
  const [uin, setUin] = useState('');
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<{ uin: string; fullName: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const validateUIN = (uinValue: string): boolean => {
    // PNG UIN format: PNG followed by 10 digits
    const pngUinRegex = /^PNG\d{10}$/;
    return pngUinRegex.test(uinValue.toUpperCase());
  };

  const handleUINSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!uin.trim()) {
      setError('Please enter your UIN/VID');
      return;
    }

    if (!validateUIN(uin)) {
      setError('Invalid UIN format. UIN should be PNG followed by 10 digits (e.g., PNG1234567890)');
      return;
    }

    setStep('face_capture');
  };

  const startFaceCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setFaceImage(imageData);

    // Stop video stream
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());

    verifyFace(imageData);
  };

  const verifyFace = async (faceImageData: string) => {
    setLoading(true);
    setStep('processing');

    try {
      console.log('🔐 Starting SevisPass login verification for UIN:', uin);
      
      // Call the real SevisPass login API
      const response = await fetch('/api/sevispass/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uin: uin.toUpperCase(),
          selfieImage: faceImageData
        }),
      });

      const result = await response.json();
      console.log('🔍 Login API response:', result);

      if (result.success && result.authenticated) {
        // Success - user verified
        console.log('✅ SevisPass facial verification successful:', result.user);
        
        const userData = {
          uin: result.user.uin,
          fullName: result.user.fullName || 'SevisPass User',
          cognitoUserId: result.user.cognitoUserId
        };
        
        setUserData(userData);
        setStep('success');
        
        // Attempt Cognito authentication with the login token
        console.log('🔐 Attempting Cognito authentication...');
        try {
          const cognitoResponse = await fetch('/api/sevispass/complete-cognito-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginToken: result.user.loginToken })
          });

          if (cognitoResponse.ok) {
            const { userData: cognitoUserData } = await cognitoResponse.json();
            console.log('✅ Cognito user data retrieved:', cognitoUserData);
            
            // Try to sign in with Cognito using adminSetUserPassword flow
            // This creates a proper Cognito session
            const { signIn } = await import('aws-amplify/auth');
            
            try {
              // First, try to sign in assuming the user exists
              const signInResult = await signIn({
                username: cognitoUserData.email,
                password: 'SevisPass-TempAuth-' + result.user.loginToken.substring(0, 8)
              });
              
              if (signInResult.isSignedIn) {
                console.log('✅ Cognito sign-in successful');
                onSuccess?.(userData);
                return;
              }
            } catch (signInError: any) {
              console.log('🔄 Cognito sign-in failed, user may not exist:', signInError.message);
              // User doesn't exist or password is wrong, create temporary session
            }
          }
        } catch (cognitoError) {
          console.warn('⚠️ Cognito authentication failed, falling back to session storage:', cognitoError);
        }

        // Fallback: Create SevisPass session for non-Cognito flows  
        console.log('🔄 Creating SevisPass session fallback...');
        if (typeof window !== 'undefined') {
          // Import auth service dynamically to avoid SSR issues
          import('@/lib/services/sevispass-auth-service').then(({ createSevisPassSession }) => {
            createSevisPassSession({
              cognitoUserId: result.user.cognitoUserId,
              uin: result.user.uin,
              userFullName: result.user.fullName
            });
            
            console.log('✅ SevisPass session fallback created');
            onSuccess?.(userData);
          });
        }
      } else {
        // Authentication failed
        console.log('❌ SevisPass login failed:', result.error);
        setError(result.error || 'Face verification failed. Please ensure your face matches your registered SevisPass profile and try again.');
        setStep('failed');
      }
    } catch (err: any) {
      console.error('❌ SevisPass login error:', err);
      setError('Unable to connect to verification service. Please check your internet connection and try again.');
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  const resetLogin = () => {
    setStep('uin_entry');
    setUin('');
    setFaceImage(null);
    setError('');
    setUserData(null);
  };

  const renderUINEntry = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          fontSize: '32px'
        }}>
          🔐
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>
          SevisPass Login
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
          Enter your UIN and verify your identity with facial recognition
        </p>
      </div>

      <form onSubmit={handleUINSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: 'var(--foreground)', 
            marginBottom: '8px' 
          }}>
            UIN/VID (Unique Identification Number)
          </label>
          <input
            type="text"
            value={uin}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().replace(/[^PNG0-9]/g, '');
              if (value.length <= 13) { // PNG + 10 digits
                setUin(value);
              }
            }}
            placeholder="PNG1234567890"
            required
            style={{
              width: '100%',
              padding: '16px 20px',
              border: '2px solid var(--border)',
              borderRadius: '12px',
              fontSize: '16px',
              background: 'var(--input)',
              color: 'var(--foreground)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              fontFamily: 'monospace',
              letterSpacing: '1px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--muted-foreground)', 
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Eye size={12} />
            Format: PNG followed by 10 digits
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !uin || !validateUIN(uin)}
          style={{
            width: '100%',
            padding: '16px 24px',
            backgroundColor: (loading || !uin || !validateUIN(uin)) ? '#9CA3AF' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (loading || !uin || !validateUIN(uin)) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          Continue to Face Verification
        </button>
      </form>

      <div style={{
        background: 'var(--muted)',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '32px',
        border: '1px solid var(--border)'
      }}>
        <h3 style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: 'var(--foreground)', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🔒 Secure Login Process
        </h3>
        <ul style={{ 
          margin: '0', 
          paddingLeft: '20px', 
          color: 'var(--muted-foreground)',
          fontSize: '12px',
          lineHeight: '1.5'
        }}>
          <li>Enter your unique UIN/VID issued during SevisPass registration</li>
          <li>Complete facial liveness detection and verification</li>
          <li>Access granted only after successful identity match</li>
          <li>All verification data is encrypted and secure</li>
        </ul>
      </div>
    </div>
  );

  const renderFaceCapture = () => {
    if (!videoRef.current?.srcObject) {
      startFaceCapture();
    }

    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>
            Facial Verification
          </h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '4px' }}>
            UIN: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{uin}</span>
          </p>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', marginBottom: '24px' }}>
            Look directly at the camera and capture a clear photo for verification
          </p>
          
          <div style={{
            background: 'var(--muted)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '13px',
            color: 'var(--muted-foreground)',
            textAlign: 'left',
            marginBottom: '24px'
          }}>
            <strong>Verification Guidelines:</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Look directly at the camera with a neutral expression</li>
              <li>Ensure your face is well-lit and clearly visible</li>
              <li>Remove sunglasses, hats, or face coverings</li>
              <li>Stay still during the capture process</li>
            </ul>
          </div>
        </div>

        {faceImage ? (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={faceImage} 
              alt="Captured face"
              style={{
                width: '280px',
                height: '280px',
                objectFit: 'cover',
                borderRadius: '50%',
                marginBottom: '24px',
                border: '4px solid var(--primary)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setFaceImage(null);
                  startFaceCapture();
                }}
                style={{
                  padding: '12px 24px',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Retake Photo
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              position: 'relative',
              display: 'inline-block',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '4px solid var(--primary)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ 
                  width: '400px',
                  height: '300px',
                  objectFit: 'cover'
                }}
              />
              {/* Face overlay guide */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '180px',
                height: '220px',
                border: '3px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                pointerEvents: 'none',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)'
              }} />
              
              {/* Liveness detection indicator */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: '#22C55E',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                Liveness Detection
              </div>
            </div>
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div style={{ marginTop: '32px' }}>
              <button
                onClick={capturePhoto}
                style={{
                  padding: '16px 32px',
                  border: 'none',
                  borderRadius: '50px',
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                <Camera size={20} />
                Verify Identity
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  };

  const renderProcessing = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        border: '4px solid var(--muted)',
        borderTop: '4px solid var(--primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 24px auto'
      }} />
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '16px' }}>
        Verifying Identity
      </h2>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '8px' }}>
        Please wait while we verify your identity...
      </p>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
        UIN: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{uin}</span>
      </p>
      
      <div style={{ marginTop: '32px' }}>
        <div style={{
          background: 'var(--muted)',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '13px',
          color: 'var(--muted-foreground)'
        }}>
          🔍 Running facial liveness detection...<br/>
          🤖 Comparing with registered biometric data...<br/>
          🔐 Validating identity match...
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  const renderSuccess = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--success)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
        fontSize: '32px',
        boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)'
      }}>
        ✅
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '16px' }}>
        Identity Verified!
      </h2>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '24px' }}>
        Welcome back, you have been successfully authenticated.
      </p>
      
      {userData && (
        <div style={{
          background: 'var(--muted)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '12px' }}>
            User Details:
          </h3>
          <p style={{ margin: '8px 0', color: 'var(--muted-foreground)' }}>
            <strong>Name:</strong> {userData.fullName}
          </p>
          <p style={{ margin: '8px 0', color: 'var(--muted-foreground)' }}>
            <strong>UIN:</strong> {userData.uin}
          </p>
          <p style={{ margin: '8px 0', color: 'var(--muted-foreground)' }}>
            <strong>Login Time:</strong> {new Date().toLocaleString()}
          </p>
        </div>
      )}
      
      <div style={{
        color: 'var(--success)',
        fontSize: '14px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        🔐 Secure biometric authentication completed
      </div>
    </div>
  );

  const renderFailed = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--destructive)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
        fontSize: '32px'
      }}>
        ❌
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '16px' }}>
        Verification Failed
      </h2>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '24px' }}>
        We were unable to verify your identity at this time.
      </p>
      
      <div style={{
        background: 'var(--muted)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'left',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '12px' }}>
          Possible Issues:
        </h3>
        <ul style={{ margin: '0', paddingLeft: '20px', color: 'var(--muted-foreground)', fontSize: '14px' }}>
          <li>Face does not match registered biometric data</li>
          <li>Poor lighting or image quality</li>
          <li>UIN may be inactive or suspended</li>
          <li>Liveness detection failed</li>
        </ul>
      </div>
      
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={resetLogin}
          style={{
            padding: '12px 24px',
            border: '2px solid var(--border)',
            borderRadius: '8px',
            background: 'transparent',
            color: 'var(--foreground)',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Try Again
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            background: 'var(--primary)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Use Different Method
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid var(--border)'
    }}>
      {error && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.5)',
          color: '#DC2626',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {step === 'uin_entry' && renderUINEntry()}
      {step === 'face_capture' && renderFaceCapture()}
      {step === 'processing' && renderProcessing()}
      {step === 'success' && renderSuccess()}
      {step === 'failed' && renderFailed()}

      {step === 'uin_entry' && (
        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted-foreground)',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Use traditional login instead
          </button>
        </div>
      )}
    </div>
  );
}