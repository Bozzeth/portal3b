"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SevisPassRegistration } from '@/components/sevispass/SevisPassRegistration';
import { ApplicationSuccessModal } from '@/components/sevispass/ApplicationSuccessModal';
import { ArrowLeft, Shield, Camera, FileCheck, Users } from 'lucide-react';

type View = 'main' | 'register';

function SevisPassContent() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>('main');
  const [user, setUser] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applicationResult, setApplicationResult] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  const handleRegistrationComplete = async (data: { 
    uin?: string; 
    applicationId?: string;
    status: 'approved' | 'pending' | 'rejected';
    fullName?: string;
    documentType?: string;
    submittedAt?: string;
    rejectionReason?: string;
  }) => {
    try {
      // Get additional user data if needed
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      // Prepare modal data
      const modalData = {
        ...data,
        submittedAt: data.submittedAt || new Date().toISOString(),
        expectedReviewTime: data.status === 'pending' ? '3-5 business days' : undefined,
      };

      // If approved, query the database to get the complete SevisPass data
      if (data.status === 'approved' && token) {
        try {
          const response = await fetch('/api/sevispass/user-data', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.exists && result.data) {
              // Update modal data with complete SevisPass information
              modalData.uin = result.data.uin;
              modalData.fullName = result.data.fullName;
            }
          }
        } catch (error) {
          console.error('Error fetching updated SevisPass data:', error);
          // Continue with the data we have
        }
      }

      setApplicationResult(modalData);
      setShowSuccessModal(true);
      setCurrentView('main');
      
    } catch (error) {
      console.error('Error handling registration completion:', error);
      
      // Fallback to show modal with provided data
      setApplicationResult({
        ...data,
        submittedAt: data.submittedAt || new Date().toISOString(),
        expectedReviewTime: data.status === 'pending' ? '3-5 business days' : undefined,
      });
      setShowSuccessModal(true);
      setCurrentView('main');
    }
  };


  const renderMainView = () => (
    <>
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
          SevisPass Application
        </h1>
        <p style={{ 
          color: 'var(--muted-foreground)', 
          fontSize: '18px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Your secure digital identity for Papua New Guinea government services using advanced facial recognition technology
        </p>
      </div>

      {/* What is SevisPass */}
      <div style={{
        background: 'var(--card)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Shield size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>What is SevisPass?</h2>
        </div>
        <p style={{ 
          color: 'var(--muted-foreground)', 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: '24px'
        }}>
          SevisPass is Papua New Guinea's secure biometric digital identity system. Using state-of-the-art facial recognition technology, SevisPass allows you to access government services quickly and securely without remembering passwords or carrying physical documents.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Camera size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Facial Recognition</h3>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
                Secure authentication using advanced liveness detection
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <FileCheck size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Document Verification</h3>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
                Automated ID document validation and processing
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Users size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Government Services</h3>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
                Access all PNG digital government services with one identity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Overview Card */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '32px',
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
        <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 12px 0' }}>
          SevisPass Registration Process
        </h3>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '24px', lineHeight: '1.5' }}>
          Complete your digital identity verification in three simple steps
        </p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
            <strong>Document Upload</strong>
            <p style={{ color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>Upload your ID document</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
            <strong>Facial Verification</strong>
            <p style={{ color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>Take a verification selfie</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
            <strong>UIN Generation</strong>
            <p style={{ color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>Receive your digital ID</p>
          </div>
        </div>
        
        {/* Prominent Call-to-Action Button */}
        <button
          onClick={() => setCurrentView('register')}
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 32px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            margin: '0 auto',
            minWidth: '200px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(1px)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
        >
          <span>Start Your Application</span>
          <span style={{ fontSize: '16px' }}>→</span>
        </button>
      </div>

      {/* Requirements */}
      <div style={{
        background: 'var(--muted)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📋 Registration Requirements
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px',
          fontSize: '14px',
          color: 'var(--muted-foreground)'
        }}>
          <div>
            <strong>Accepted Documents:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>PNG National Identity Card</li>
              <li>PNG Driver's License</li>
              <li>PNG Passport</li>
              <li>International Passport</li>
            </ul>
          </div>
          <div>
            <strong>Technical Requirements:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Camera-enabled device</li>
              <li>Good lighting for photos</li>
              <li>Stable internet connection</li>
              <li>Valid email address</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );

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
          onClick={() => {
            if (currentView === 'main') {
              router.push('/dashboard');
            } else {
              setCurrentView('main');
            }
          }}
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
          {currentView === 'main' ? 'Back to Dashboard' : 'Back to Main'}
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
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {currentView === 'main' && renderMainView()}
        
        {currentView === 'register' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SevisPassRegistration
              user={user}
              onComplete={handleRegistrationComplete}
              onCancel={() => setCurrentView('main')}
            />
          </div>
        )}
        
      </div>

      {/* Success Modal */}
      {showSuccessModal && applicationResult && (
        <ApplicationSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setApplicationResult(null);
          }}
          data={applicationResult}
        />
      )}
    </div>
  );
}

export default function SevisPassPage() {
  return (
    <AuthGuard>
      <SevisPassContent />
    </AuthGuard>
  );
}