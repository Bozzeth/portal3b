"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SevisPassRegistration } from '@/components/sevispass/SevisPassRegistration';
import { ArrowLeft, Shield, Camera, FileCheck, Users } from 'lucide-react';

type View = 'main' | 'register';

function SevisPassContent() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>('main');
  const [user, setUser] = useState<any>(null);

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

  const handleRegistrationComplete = (data: { uin: string; status: 'approved' | 'pending' | 'rejected' }) => {
    if (data.status === 'approved') {
      alert(`🎉 SevisPass Approved!\n\nYour UIN: ${data.uin}\n\nYou can now use facial recognition to access government services.`);
    } else if (data.status === 'pending') {
      alert(`⏳ Application Under Review\n\nApplication ID: ${data.uin}\n\nYou'll receive an email notification once reviewed (1-3 business days).`);
    } else {
      alert(`❌ Application Rejected\n\nPlease ensure high-quality images and try again.`);
    }
    setCurrentView('main');
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

      {/* Apply Action */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'var(--primary)',
          borderRadius: '16px',
          padding: '32px',
          color: 'white',
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center'
        }}
        onClick={() => setCurrentView('register')}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 12px 0' }}>
            Start Your Application
          </h3>
          <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '20px', lineHeight: '1.5' }}>
            Begin your SevisPass registration process with document verification and facial recognition setup.
          </p>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            ✓ Document verification<br/>
            ✓ Facial recognition setup<br/>
            ✓ UIN generation
          </div>
        </div>
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
              onComplete={handleRegistrationComplete}
              onCancel={() => setCurrentView('main')}
            />
          </div>
        )}
        
      </div>
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