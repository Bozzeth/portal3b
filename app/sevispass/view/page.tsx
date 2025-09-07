"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SevisPassCard } from '@/components/sevispass/SevisPassCard';
import { ArrowLeft, AlertCircle, Clock, XCircle, CheckCircle, FileText, RefreshCw } from 'lucide-react';

function SevisPassViewContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sevisPassData, setSevisPassData] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Loading timeout - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    loadUserData().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  const loadUserData = async () => {
    try {
      console.log('🔍 Loading user data...');
      
      // Check if Amplify is configured
      try {
        const config = Amplify.getConfig();
        console.log('🔧 Amplify config available:', !!config.Auth?.Cognito?.userPoolId);
        if (!config.Auth?.Cognito?.userPoolId) {
          throw new Error('Amplify not properly configured');
        }
      } catch (configError) {
        console.error('❌ Amplify configuration error:', configError);
        // Add a delay and retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const currentUser = await getCurrentUser();
      console.log('✅ Current user:', currentUser);
      setUser(currentUser);
      
      // Check if user has a registered SevisPass or pending application
      console.log('🌐 Calling /api/sevispass/user-data with userId:', currentUser.userId);
      const response = await fetch(`/api/sevispass/user-data?userId=${encodeURIComponent(currentUser.userId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📊 API result:', result);
      
      if (result.exists && result.data) {
        // User has an approved SevisPass
        setSevisPassData(result.data);
        setApplicationStatus('approved');
      } else if (result.hasApplication) {
        // User has an application (pending, under review, or rejected)
        setApplicationStatus(result.applicationStatus);
        setApplicationData(result.applicationData);
        setSevisPassData(null);
      } else {
        // No SevisPass or application found
        setSevisPassData(null);
        setApplicationStatus(null);
        setApplicationData(null);
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      // On error, assume no SevisPass exists
      setSevisPassData(null);
      setApplicationStatus(null);
      setApplicationData(null);
    } finally {
      console.log('✅ Setting loading to false');
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

        {/* Render different states based on application status */}
        {applicationStatus === 'approved' && sevisPassData ? (
          <>
            {/* Approved SevisPass */}
            <SevisPassCard 
              data={{
                ...sevisPassData,
                photo: sevisPassData.photoUrl
              }}
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
        ) : applicationStatus === 'under_review' ? (
          // Application Under Review
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            border: '2px solid #f59e0b'
          }}>
            <Clock size={64} style={{ color: '#f59e0b', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#f59e0b' }}>
              Application Under Review
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              Your SevisPass application is being reviewed by our verification team. This process typically takes {applicationData?.expectedReviewTime || '3-5 business days'}.
            </p>
            
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '400px',
              margin: '0 auto 32px auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileText size={20} style={{ color: '#f59e0b' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Application Details</h3>
              </div>
              <div style={{ textAlign: 'left', fontSize: '14px' }}>
                <p style={{ margin: '4px 0' }}>
                  <strong>Application ID:</strong> {applicationData?.applicationId}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Submitted:</strong> {new Date(applicationData?.submittedAt).toLocaleDateString()}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Document Type:</strong> {applicationData?.documentType}
                </p>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
              }}
            >
              <RefreshCw size={16} />
              Check Status
            </button>
          </div>
        ) : applicationStatus === 'rejected' ? (
          // Application Rejected
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            border: '2px solid var(--destructive)'
          }}>
            <XCircle size={64} style={{ color: 'var(--destructive)', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--destructive)' }}>
              Application Rejected
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              Unfortunately, your SevisPass application has been rejected. Please review the reason below and resubmit with corrections.
            </p>
            
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '500px',
              margin: '0 auto 32px auto',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--destructive)' }}>
                Rejection Reason
              </h3>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                {applicationData?.rejectionReason}
              </p>
            </div>

            {applicationData?.canReapply && (
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
                Apply Again
              </button>
            )}
          </div>
        ) : (
          // No Application Yet
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