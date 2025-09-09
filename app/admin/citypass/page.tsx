"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from 'aws-amplify/storage';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LogoInline } from '@/components/ui/Logo';
import { 
  ArrowLeft, 
  Eye, 
  Check, 
  X, 
  Clock, 
  FileText,
  User,
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

interface CityPassApplication {
  userId: string;
  applicationId: string;
  status: string;
  submittedAt: string;
  category: string;
  fullName: string;
  sevispassUin: string;
  phoneNumber?: string;
  email?: string;
  supportingDocumentKeys?: string;
  documentType?: string;
  employerName?: string;
  schoolName?: string;
  propertyAddress?: string;
  businessName?: string;
  voucherUin?: string;
  relationshipToVoucher?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

function CityPassAdminContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<CityPassApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<CityPassApplication | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const loadUserAndApplications = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        // Check if user is CityPass admin
        // In production, you'd check user groups/roles
        // For now, we'll allow any authenticated user to access for testing
        console.log('Current user:', currentUser);
        setUser(currentUser);

        // Load pending applications
        await loadApplications();

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    loadUserAndApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const result = await (client.models as any).CityPassApplication.list();
      if (result.data) {
        // Sort by submission date (newest first)
        const sortedApps = result.data.sort((a, b) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
        setApplications(sortedApps as CityPassApplication[]);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      setError('Failed to load applications');
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedApp || !user) return;

    setReviewing(true);
    setError('');

    try {
      const reviewData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewNotes: reviewNotes.trim() || undefined,
        reviewedBy: user.signInDetails?.loginId || user.username,
        reviewedAt: new Date().toISOString()
      };

      if (action === 'reject') {
        reviewData.rejectionReason = reviewNotes.trim() || 'Application does not meet requirements';
      }

      if (action === 'approve') {
        // Generate CityPass ID
        const citypassId = `CP${Date.now().toString().slice(-8)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        reviewData.citypassId = citypassId;
        reviewData.issuedAt = new Date().toISOString();
      }

      // Update application
      const updateResult = await (client.models as any).CityPassApplication.update({
        userId: selectedApp.userId,
        ...reviewData
      });

      if (updateResult.errors && updateResult.errors.length > 0) {
        throw new Error(`Failed to update application: ${updateResult.errors[0].message}`);
      }

      // If approved, create CityPassHolder record
      if (action === 'approve') {
        const holderData = {
          userId: selectedApp.userId,
          citypassId: reviewData.citypassId,
          fullName: selectedApp.fullName,
          sevispassUin: selectedApp.sevispassUin,
          category: selectedApp.category as any,
          issuedAt: reviewData.issuedAt,
          expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years
          status: 'active' as const,
          qrCodeData: JSON.stringify({
            type: 'citypass',
            id: reviewData.citypassId,
            uin: selectedApp.sevispassUin,
            name: selectedApp.fullName,
            category: selectedApp.category,
            issued: reviewData.issuedAt
          })
        };

        const holderResult = await (client.models as any).CityPassHolder.create(holderData);
        if (holderResult.errors && holderResult.errors.length > 0) {
          console.warn('Failed to create holder record:', holderResult.errors);
        }
      }

      console.log(`✅ Application ${action}d successfully`);
      
      // Refresh applications and close modal
      await loadApplications();
      setSelectedApp(null);
      setReviewAction(null);
      setReviewNotes('');

    } catch (error: any) {
      console.error(`❌ Failed to ${action} application:`, error);
      setError(error.message || `Failed to ${action} application`);
    } finally {
      setReviewing(false);
    }
  };

  const loadApplicationDocuments = async (applicationId: string) => {
    setLoadingDocuments(true);
    setDocuments([]);
    
    console.log('🔍 Admin loading documents for application:', applicationId);
    
    try {
      const response = await fetch(`/api/citypass/documents?applicationId=${applicationId}`);
      
      console.log('📡 Raw API response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      // Get response as text first to debug
      const responseText = await response.text();
      console.log('📄 Raw response text:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('✅ Parsed JSON result:', result);
      } catch (jsonError) {
        console.error('❌ JSON parse error:', jsonError);
        console.error('❌ Response was not valid JSON:', responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }
      
      if (response.ok && result.documents) {
        setDocuments(result.documents);
        console.log('✅ Loaded documents:', result.documents.length, result.documents);
      } else {
        console.error('❌ Failed to load documents:', result.error || result.message);
        setDocuments([]);
      }
    } catch (error) {
      console.error('❌ Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FCD34D';
      case 'under_review': return '#60A5FA';
      case 'approved': return '#34D399';
      case 'rejected': return '#F87171';
      default: return '#9CA3AF';
    }
  };

  const getCategoryDisplay = (category: string) => {
    const displays: Record<string, string> = {
      employed: 'Employed Resident',
      student: 'Student',
      property_owner: 'Property Owner', 
      business_owner: 'Business Owner',
      dependent: 'Dependent',
      vouched: 'Vouched Resident'
    };
    return displays[category] || category;
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && app.category !== categoryFilter) return false;
    return true;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'var(--background)' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
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

      <div className="container" style={{ padding: '80px 20px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <LogoInline size="medium" showText={true} variant="horizontal" solidYellow={true} />
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '16px 0 8px' }}>
            CityPass Admin Dashboard
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
            Review and approve CityPass applications
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
              Total Applications
            </div>
          </div>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#FCD34D' }}>
              {stats.pending}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
              Pending Review
            </div>
          </div>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#34D399' }}>
              {stats.approved}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
              Approved
            </div>
          </div>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#F87171' }}>
              {stats.rejected}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
              Rejected
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '8px' }}>
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: '14px'
              }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '8px' }}>
              Category:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: '14px'
              }}
            >
              <option value="all">All</option>
              <option value="employed">Employed</option>
              <option value="student">Student</option>
              <option value="property_owner">Property Owner</option>
              <option value="business_owner">Business Owner</option>
              <option value="dependent">Dependent</option>
              <option value="vouched">Vouched</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={loadApplications}
              style={{
                padding: '8px 16px',
                background: 'var(--primary)',
                color: 'black',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Applications List */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {filteredApplications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                No Applications Found
              </h3>
              <p style={{ color: 'var(--muted-foreground)' }}>
                {statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters to see more applications.'
                  : 'No CityPass applications have been submitted yet.'
                }
              </p>
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                padding: '16px 24px',
                background: 'var(--muted)',
                fontSize: '14px',
                fontWeight: '600',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>Applicant</div>
                <div>Category</div>
                <div>Status</div>
                <div>Submitted</div>
                <div>SevisPass UIN</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              {filteredApplications.map((app) => (
                <div
                  key={app.applicationId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                      {app.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      {app.email} • {app.phoneNumber}
                    </div>
                  </div>
                  
                  <div>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: 'var(--muted)',
                      color: 'var(--muted-foreground)'
                    }}>
                      {getCategoryDisplay(app.category)}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: `${getStatusColor(app.status)}20`,
                      color: getStatusColor(app.status),
                      fontWeight: '500'
                    }}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '14px' }}>
                    {formatDate(app.submittedAt)}
                  </div>
                  
                  <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                    {app.sevispassUin}
                  </div>
                  
                  <div>
                    <button
                      onClick={() => {
                        console.log('🎯 Admin reviewing application:', {
                          applicationId: app.applicationId,
                          userId: app.userId,
                          hasDocumentKeys: !!app.supportingDocumentKeys,
                          documentKeys: app.supportingDocumentKeys
                        });
                        setSelectedApp(app);
                        // Always try to load documents - let the API handle if there are none
                        loadApplicationDocuments(app.applicationId);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--primary)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={14} />
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.5)',
            color: '#DC2626',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600' }}>
                Review Application
              </h2>
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setReviewAction(null);
                  setReviewNotes('');
                  setDocuments([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted-foreground)'
                }}
              >
                ×
              </button>
            </div>

            {/* Application Details */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    Applicant
                  </label>
                  <div style={{ fontWeight: '500' }}>{selectedApp.fullName}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    SevisPass UIN
                  </label>
                  <div style={{ fontFamily: 'monospace' }}>{selectedApp.sevispassUin}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    Category
                  </label>
                  <div>{getCategoryDisplay(selectedApp.category)}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    Status
                  </label>
                  <div>
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: `${getStatusColor(selectedApp.status)}20`,
                      color: getStatusColor(selectedApp.status),
                      fontWeight: '500'
                    }}>
                      {selectedApp.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    Email
                  </label>
                  <div>{selectedApp.email}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    Phone
                  </label>
                  <div>{selectedApp.phoneNumber}</div>
                </div>
              </div>

              {/* Category-specific info */}
              {selectedApp.employerName && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    Employer
                  </label>
                  <div>{selectedApp.employerName}</div>
                </div>
              )}
              {selectedApp.schoolName && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    School/Institution
                  </label>
                  <div>{selectedApp.schoolName}</div>
                </div>
              )}
              {selectedApp.propertyAddress && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    Property Address
                  </label>
                  <div>{selectedApp.propertyAddress}</div>
                </div>
              )}
              {selectedApp.businessName && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                    Business
                  </label>
                  <div>{selectedApp.businessName}</div>
                </div>
              )}
              {selectedApp.voucherUin && (
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                      Voucher UIN
                    </label>
                    <div style={{ fontFamily: 'monospace' }}>{selectedApp.voucherUin}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                      Relationship
                    </label>
                    <div>{selectedApp.relationshipToVoucher}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Supporting Documents */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Supporting Documents
                </h3>
                
                {loadingDocuments ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '12px',
                    background: 'var(--muted)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                      Loading documents...
                    </div>
                  </div>
                ) : documents.length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {documents.map((doc, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'var(--muted)',
                        borderRadius: '8px',
                        border: '1px solid var(--border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: 'var(--muted-foreground)' }} />
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>
                            {doc.filename}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {doc.url ? (
                            <>
                              <button
                                onClick={() => window.open(doc.url, '_blank')}
                                style={{
                                  padding: '6px 12px',
                                  background: 'var(--primary)',
                                  color: 'black',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = doc.url;
                                  link.download = doc.filename;
                                  link.click();
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: 'var(--secondary)',
                                  color: 'var(--secondary-foreground)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                Download
                              </button>
                            </>
                          ) : (
                            <span style={{ 
                              fontSize: '12px', 
                              color: 'var(--destructive)',
                              padding: '6px 12px'
                            }}>
                              {doc.error || 'URL not available'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                    No supporting documents found
                  </div>
                )}
              </div>

            {/* Review Section */}
            {selectedApp.status === 'pending' && (
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                  Review Decision
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your review decision..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleReview('approve')}
                    disabled={reviewing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: reviewing ? '#9CA3AF' : '#34D399',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: reviewing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Check size={16} />
                    {reviewing ? 'Processing...' : 'Approve Application'}
                  </button>
                  
                  <button
                    onClick={() => handleReview('reject')}
                    disabled={reviewing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: reviewing ? '#9CA3AF' : '#F87171',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: reviewing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <X size={16} />
                    {reviewing ? 'Processing...' : 'Reject Application'}
                  </button>
                </div>
              </div>
            )}

            {/* Review History */}
            {selectedApp.reviewedBy && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                background: 'var(--muted)',
                borderRadius: '8px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Review History
                </h4>
                <div style={{ fontSize: '14px' }}>
                  <div>Reviewed by: {selectedApp.reviewedBy}</div>
                  <div>Date: {selectedApp.reviewedAt ? formatDate(selectedApp.reviewedAt) : 'N/A'}</div>
                  {selectedApp.reviewNotes && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>Notes:</strong> {selectedApp.reviewNotes}
                    </div>
                  )}
                  {selectedApp.rejectionReason && (
                    <div style={{ marginTop: '8px', color: '#F87171' }}>
                      <strong>Rejection Reason:</strong> {selectedApp.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error in Modal */}
            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.5)',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CityPassAdminPage() {
  return (
    <AuthGuard>
      <CityPassAdminContent />
    </AuthGuard>
  );
}