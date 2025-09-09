"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LogoInline } from '@/components/ui/Logo';
import { ArrowLeft, Clock, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
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
  documentType: string;
  employerName?: string;
  schoolName?: string;
  propertyAddress?: string;
  businessName?: string;
  voucherUin?: string;
  relationshipToVoucher?: string;
  supportingDocumentKeys?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
    case 'under_review':
      return <Clock className="text-yellow-500" size={24} />;
    case 'approved':
      return <CheckCircle className="text-green-500" size={24} />;
    case 'rejected':
      return <XCircle className="text-red-500" size={24} />;
    default:
      return <AlertCircle className="text-gray-500" size={24} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
    case 'under_review':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'approved':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'rejected':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
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

const formatCategory = (category: string) => {
  const categoryMap: { [key: string]: string } = {
    'employed': 'Employed Resident',
    'student': 'Student',
    'property_owner': 'Property Owner',
    'business_owner': 'Business Owner',
    'dependent': 'Dependent',
    'vouched': 'Vouched Resident'
  };
  return categoryMap[category] || category;
};

function CityPassStatusContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [application, setApplication] = useState<CityPassApplication | null>(null);
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

    const loadUserAndApplication = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Fetch user's CityPass application
        console.log('🔍 Looking for CityPass application for userId:', currentUser.userId);
        
        const result = await client.models.CityPassApplication.list({
          filter: { userId: { eq: currentUser.userId } }
        });

        if (result.data && result.data.length > 0) {
          // Get the most recent application
          const latestApp = result.data.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          )[0];
          
          console.log('✅ Found CityPass application:', latestApp.applicationId);
          setApplication(latestApp as CityPassApplication);
        } else {
          console.log('❌ No CityPass application found for user');
          setError('No CityPass application found. Please submit an application first.');
        }

      } catch (error) {
        console.error('Error loading application data:', error);
        setError('Failed to load application information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserAndApplication();
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
              No Application Found
            </h2>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '24px' }}>
              {error}
            </p>
            <button
              onClick={() => router.push('/citypass/apply')}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginRight: '16px'
              }}
            >
              Apply for CityPass
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
              CityPass Application Status
            </h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
              Track your Port Moresby resident credentials application
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
                Your CityPass application has been received and is now under review. You can track its progress below.
              </p>
            </div>
          )}
          {application && (
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

              {/* Application Details */}
              <div style={{ padding: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                  Application Details
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                      Applicant Name
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
                      {formatCategory(application.category)}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                      Phone Number
                    </label>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                      {application.phoneNumber}
                    </p>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                      Email
                    </label>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                      {application.email}
                    </p>
                  </div>
                </div>

                {/* Category-specific details */}
                {application.employerName && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                      Employer
                    </label>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                      {application.employerName}
                    </p>
                  </div>
                )}

                {application.schoolName && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                      School/Institution
                    </label>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                      {application.schoolName}
                    </p>
                  </div>
                )}

                {application.businessName && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                      Business Name
                    </label>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                      {application.businessName}
                    </p>
                  </div>
                )}

                {application.propertyAddress && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                      Property Address
                    </label>
                    <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                      {application.propertyAddress}
                    </p>
                  </div>
                )}

                {application.voucherUin && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                        Voucher UIN
                      </label>
                      <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                        {application.voucherUin}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                        Relationship
                      </label>
                      <p style={{ fontSize: '16px', fontWeight: '500', margin: '4px 0 0 0' }}>
                        {application.relationshipToVoucher}
                      </p>
                    </div>
                  </div>
                )}

                {/* Supporting Documents */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--muted-foreground)' }}>
                    Supporting Documents
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    padding: '12px',
                    background: 'var(--muted)',
                    borderRadius: '8px'
                  }}>
                    <FileText size={16} style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                      {application.supportingDocumentKeys ? 
                        `${JSON.parse(application.supportingDocumentKeys).length} document(s) uploaded` : 
                        'No documents uploaded'
                      }
                    </span>
                  </div>
                </div>

                {/* Status-specific information */}
                {application.status === 'pending' && (
                  <div style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginTop: '24px'
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
                    marginTop: '24px'
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
                    marginTop: '24px'
                  }}>
                    <p style={{ color: 'rgb(21, 128, 61)', fontSize: '14px', margin: 0 }}>
                      <strong>Congratulations! Your CityPass application has been approved.</strong> Your CityPass will be available in your dashboard shortly.
                    </p>
                    {application.reviewedAt && (
                      <p style={{ color: 'rgb(21, 128, 61)', fontSize: '12px', margin: '8px 0 0 0' }}>
                        Approved on {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                )}

                {application.status === 'rejected' && application.rejectionReason && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginTop: '24px'
                  }}>
                    <p style={{ color: 'rgb(185, 28, 28)', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
                      Application Rejected
                    </p>
                    <p style={{ color: 'rgb(185, 28, 28)', fontSize: '14px', margin: 0 }}>
                      {application.rejectionReason}
                    </p>
                    {application.reviewedAt && (
                      <p style={{ color: 'rgb(185, 28, 28)', fontSize: '12px', margin: '8px 0 0 0' }}>
                        Rejected on {new Date(application.reviewedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                    <button
                      onClick={() => router.push('/citypass/apply')}
                      style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginTop: '12px'
                      }}
                    >
                      Submit New Application
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CityPassStatusPage() {
  return (
    <AuthGuard>
      <CityPassStatusContent />
    </AuthGuard>
  );
}