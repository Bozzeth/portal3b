"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LogoInline } from '@/components/ui/Logo';
import { ArrowLeft, Clock, CheckCircle, XCircle, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

interface CityPassApplication {
  applicationId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  category: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  rejectionReason?: string;
  reviewedAt?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
    case 'under_review':
      return <Clock className="text-yellow-500" size={32} />;
    case 'approved':
      return <CheckCircle className="text-green-500" size={32} />;
    case 'rejected':
      return <XCircle className="text-red-500" size={32} />;
    default:
      return <AlertCircle className="text-gray-500" size={32} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
    case 'under_review':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
    case 'approved':
      return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
    case 'rejected':
      return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200';
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'under_review':
      return 'Under Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
};

function CityPassContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [application, setApplication] = useState<CityPassApplication | null>(null);
  const [sevisPassData, setSevisPassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    // Check if user just submitted application
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('submitted') === 'true') {
      setJustSubmitted(true);
      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    const loadUserAndData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Check if user has SevisPass first
        const sevisResponse = await fetch(`/api/sevispass/check-user?userId=${currentUser.userId}`);
        const sevisResult = await sevisResponse.json();
        
        if (!sevisResult.hasSevisPass) {
          setError('You must have a valid SevisPass before applying for CityPass. Please apply for SevisPass first.');
          setLoading(false);
          return;
        }
        
        setSevisPassData(sevisResult.sevisPassData);

        // Check for existing CityPass application
        const result = await client.models.CityPassApplication.list({
          filter: { userId: { eq: currentUser.userId } }
        });

        if (result.data && result.data.length > 0) {
          // Get the most recent application
          const latestApp = result.data.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          )[0];
          
          setApplication(latestApp as CityPassApplication);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserAndData();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--foreground)'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)', padding: '40px 20px' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }}>
            <AlertCircle size={48} style={{ color: 'var(--destructive)', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
              SevisPass Required
            </h2>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '24px' }}>
              {error}
            </p>
            <button
              onClick={() => router.push('/sevispass/apply')}
              style={{
                background: 'var(--primary)',
                color: 'black',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginRight: '16px'
              }}
            >
              Apply for SevisPass
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: 'var(--card)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
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
            fontSize: '14px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <header style={{ 
        background: 'var(--card)', 
        borderBottom: '1px solid var(--border)',
        padding: '20px 0',
        paddingTop: '80px'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <LogoInline size="medium" showText={true} variant="horizontal" solidYellow={true} />
            <h1 style={{ fontSize: '32px', fontWeight: '600', margin: '16px 0 8px 0' }}>
              CityPass
            </h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
              Port Moresby resident credentials
            </p>
          </div>
        </div>
      </header>

      <main style={{ padding: '40px 20px' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Success Banner */}
          {justSubmitted && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <CheckCircle style={{ color: 'rgb(21, 128, 61)', marginBottom: '8px' }} size={32} />
              <h3 style={{ color: 'rgb(21, 128, 61)', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
                Application Submitted Successfully!
              </h3>
              <p style={{ color: 'rgb(21, 128, 61)', fontSize: '14px', margin: 0 }}>
                Your CityPass application has been received and is now under review. Track progress below.
              </p>
            </div>
          )}
          
          {application ? (
            // Show application status if user has one
            <div style={{
              background: 'var(--card)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflow: 'hidden'
            }}>
              {/* Status Header */}
              <div style={{
                padding: '32px',
                borderBottom: '1px solid var(--border)',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  {getStatusIcon(application.status)}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }} className={getStatusColor(application.status)}>
                  {formatStatus(application.status)}
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
                  Application #{application.applicationId}
                </h2>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Submitted on {new Date(application.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Quick Status Info */}
              <div style={{ padding: '32px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                      Applicant
                    </label>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                      {application.fullName}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                      Category
                    </label>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                      {application.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                </div>

                {/* Status-specific information */}
                {application.status === 'pending' && (
                  <div style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <p style={{ color: 'rgb(161, 98, 7)', fontSize: '14px', margin: 0 }}>
                      <strong>Your application is pending review.</strong> Our team will review your submission and supporting documents. 
                      You can expect a decision within 3-5 business days.
                    </p>
                  </div>
                )}

                {application.status === 'under_review' && (
                  <div style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <p style={{ color: 'rgb(161, 98, 7)', fontSize: '14px', margin: 0 }}>
                      <strong>Your application is currently under review.</strong> Our review team is examining your documents and information. 
                      We'll notify you once a decision has been made.
                    </p>
                  </div>
                )}

                {application.status === 'approved' && (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <p style={{ color: 'rgb(21, 128, 61)', fontSize: '14px', margin: '0 0 12px 0' }}>
                      <strong>Congratulations! Your CityPass application has been approved.</strong> Your CityPass is now ready to view and use.
                    </p>
                  </div>
                )}

                {application.status === 'rejected' && application.rejectionReason && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <p style={{ color: 'rgb(185, 28, 28)', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
                      Application Rejected
                    </p>
                    <p style={{ color: 'rgb(185, 28, 28)', fontSize: '14px', margin: '0 0 12px 0' }}>
                      {application.rejectionReason}
                    </p>
                    <button
                      onClick={() => router.push('/citypass/apply')}
                      style={{
                        background: 'var(--primary)',
                        color: 'black',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Submit New Application
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {application.status === 'approved' ? (
                    <button
                      onClick={() => router.push('/citypass/view')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: '#FFD700',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)'
                      }}
                    >
                      <CheckCircle size={16} />
                      View My CityPass
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/citypass/status')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'var(--primary)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <FileText size={16} />
                      View Full Details
                      <ArrowRight size={16} />
                    </button>
                  )}
                  
                  {application.status === 'rejected' && (
                    <button
                      onClick={() => router.push('/citypass/apply')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'var(--card)',
                        color: 'var(--foreground)',
                        border: '2px solid var(--primary)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Resubmit Application
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Show apply prompt if user has no application
            <div style={{
              background: 'var(--card)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '40px',
              textAlign: 'center'
            }}>
              <FileText size={64} style={{ color: 'var(--muted-foreground)', marginBottom: '24px' }} />
              
              <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '16px' }}>
                Apply for CityPass
              </h2>
              
              <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '8px' }}>
                Get your Port Moresby resident credentials to access city services.
              </p>
              
              <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', marginBottom: '32px' }}>
                ✅ SevisPass verified • Ready to apply
              </p>

              <div style={{
                background: 'var(--muted)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '32px',
                textAlign: 'left'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Application Categories Available:
                </h3>
                <ul style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0, paddingLeft: '20px' }}>
                  <li>Employed Resident (Employment verification)</li>
                  <li>Student (Educational institution enrollment)</li>
                  <li>Property Owner (Property ownership/rental documents)</li>
                  <li>Business Owner (Business registration documents)</li>
                  <li>Dependent (Family member of CityPass holder)</li>
                  <li>Vouched Resident (Personal vouching system)</li>
                </ul>
              </div>

              <button
                onClick={() => router.push('/citypass/apply')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 32px',
                  background: 'var(--primary)',
                  color: 'black',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Start Application
                <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CityPassPage() {
  return (
    <AuthGuard>
      <CityPassContent />
    </AuthGuard>
  );
}