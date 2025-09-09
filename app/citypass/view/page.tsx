"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CityPassCard } from '@/components/citypass/CityPassCard';
import { ArrowLeft, AlertCircle, Clock, XCircle, CheckCircle, RefreshCw, Car, Building, MapPin } from 'lucide-react';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

function CityPassViewContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cityPassData, setCityPassData] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Loading timeout - forcing loading to false');
      setLoading(false);
    }, 10000);

    loadUserData().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => clearTimeout(timeoutId);
  }, []);

  const loadUserData = async () => {
    try {
      console.log('🔍 Loading CityPass user data...');
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Check for CityPass holder record first
      const holderResult = await (client.models as any).CityPassHolder.list({
        filter: { userId: { eq: currentUser.userId } }
      });
      
      if (holderResult.data && holderResult.data.length > 0) {
        // User has an approved CityPass
        const cityPassHolder = holderResult.data[0];
        
        // Get SevisPass photo for the CityPass
        try {
          const sevisResponse = await fetch(`/api/sevispass/user-data?userId=${currentUser.userId}`);
          const sevisResult = await sevisResponse.json();
          
          if (sevisResult.exists && sevisResult.data?.photoUrl) {
            // Add SevisPass photo to CityPass data
            setCityPassData({
              ...cityPassHolder,
              photo: sevisResult.data.photoUrl
            });
          } else {
            setCityPassData(cityPassHolder);
          }
        } catch (photoError) {
          console.error('Error loading SevisPass photo:', photoError);
          setCityPassData(cityPassHolder);
        }
        
        setApplicationStatus('approved');
      } else {
        // Check for pending/rejected applications
        const appResult = await (client.models as any).CityPassApplication.list({
          filter: { userId: { eq: currentUser.userId } }
        });
        
        if (appResult.data && appResult.data.length > 0) {
          // Get most recent application
          const latestApp = appResult.data.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          )[0];
          
          setApplicationStatus(latestApp.status);
          setApplicationData(latestApp);
          setCityPassData(null);
        } else {
          // No CityPass or application found
          setCityPassData(null);
          setApplicationStatus(null);
          setApplicationData(null);
        }
      }
    } catch (error) {
      console.error('❌ Error loading CityPass data:', error);
      setCityPassData(null);
      setApplicationStatus(null);
      setApplicationData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForCityPass = () => {
    router.push('/citypass/apply');
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
          borderTop: '3px solid #F59E0B',
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
        background: 'radial-gradient(circle at 70% 30%, #FFD700 0%, transparent 50%)',
        opacity: 0.1,
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
            background: 'linear-gradient(90deg, #FFD700 0%, #000000 100%)',
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
            My CityPass
          </h1>
          <p style={{ 
            color: 'var(--muted-foreground)', 
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Your Port Moresby resident credential for accessing city services
          </p>
        </div>

        {/* Render different states based on application status */}
        {applicationStatus === 'approved' && cityPassData ? (
          <>
            {/* Approved CityPass */}
            <CityPassCard 
              data={{
                citypassId: cityPassData.citypassId,
                fullName: cityPassData.fullName,
                category: cityPassData.category,
                issuedDate: cityPassData.issuedAt,
                expiryDate: cityPassData.expiryDate,
                status: cityPassData.status,
                sevispassUin: cityPassData.sevispassUin,
                photo: cityPassData.photo || cityPassData.photoImageKey
              }}
              showActions={true}
            />

          </>
        ) : applicationStatus === 'under_review' ? (
          // Application Under Review
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            border: '2px solid #FFD700'
          }}>
            <Clock size={64} style={{ color: '#FFD700', marginBottom: '24px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: '#FFD700' }}>
              Application Under Review
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
              Your CityPass application is being reviewed by our verification team. This process typically takes 3-5 business days.
            </p>
            
            <div style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '400px',
              margin: '0 auto 32px auto'
            }}>
              <div style={{ textAlign: 'left', fontSize: '14px' }}>
                <p style={{ margin: '4px 0' }}>
                  <strong>Application ID:</strong> {applicationData?.applicationId}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Submitted:</strong> {new Date(applicationData?.submittedAt).toLocaleDateString()}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Category:</strong> {applicationData?.category}
                </p>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#FFD700',
                color: 'black',
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
              Unfortunately, your CityPass application has been rejected. Please review the reason below and resubmit with corrections.
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
                {applicationData?.rejectionReason || 'No reason provided'}
              </p>
            </div>

            <button
              onClick={handleApplyForCityPass}
              style={{
                padding: '16px 32px',
                background: '#FFD700',
                color: 'black',
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
              No CityPass Found
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', maxWidth: '400px', margin: '0 auto 32px auto' }}>
              You don't have a CityPass yet. Apply now to get your Port Moresby resident credentials for accessing city services.
            </p>
            <button
              onClick={handleApplyForCityPass}
              style={{
                padding: '16px 32px',
                background: '#FFD700',
                color: 'black',
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
              Apply for CityPass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CityPassViewPage() {
  return (
    <AuthGuard>
      <CityPassViewContent />
    </AuthGuard>
  );
}