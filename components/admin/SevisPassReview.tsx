"use client";

import { useState, useEffect } from 'react';
import { Check, X, Eye, Download, Clock, User, FileText, Camera } from 'lucide-react';

interface PendingApplication {
  id: string;
  applicationId: string;
  applicantName: string;
  documentType: 'nid' | 'drivers_license' | 'png_passport' | 'international_passport';
  documentNumber: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  documentImage: string;
  selfieImage: string;
  confidenceScore: number;
  submittedAt: string;
  extractedInfo: {
    documentText?: string;
    faceMatchScore: number;
    documentQuality: number;
    livenessScore?: number;
  };
  status: 'pending' | 'approved' | 'rejected';
}

interface SevisPassReviewProps {
  isAdmin?: boolean;
}

export function SevisPassReview({ isAdmin = false }: SevisPassReviewProps) {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<PendingApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [reviewNote, setReviewNote] = useState('');
  const [processingReview, setProcessingReview] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real implementation, this would fetch from API
      const mockApplications: PendingApplication[] = [
        {
          id: '1',
          applicationId: 'APP1703856012ABC',
          applicantName: 'John Doe',
          documentType: 'nid',
          documentNumber: 'NID123456789',
          dateOfBirth: '1990-01-01',
          phoneNumber: '+67512345678',
          email: 'john.doe@example.com',
          documentImage: '/api/placeholder/400/300',
          selfieImage: '/api/placeholder/300/300',
          confidenceScore: 85,
          submittedAt: '2024-01-15T10:30:00Z',
          extractedInfo: {
            documentText: 'PAPUA NEW GUINEA NATIONAL IDENTITY CARD\nJOHN DOE\n01/01/1990\nNID123456789',
            faceMatchScore: 85,
            documentQuality: 90,
            livenessScore: 95
          },
          status: 'pending'
        },
        {
          id: '2',
          applicationId: 'APP1703856098DEF',
          applicantName: 'Jane Smith',
          documentType: 'drivers_license',
          documentNumber: 'DL987654321',
          dateOfBirth: '1985-03-15',
          phoneNumber: '+67598765432',
          email: 'jane.smith@example.com',
          documentImage: '/api/placeholder/400/300',
          selfieImage: '/api/placeholder/300/300',
          confidenceScore: 82,
          submittedAt: '2024-01-15T11:45:00Z',
          extractedInfo: {
            documentText: 'PAPUA NEW GUINEA DRIVERS LICENSE\nJANE SMITH\n15/03/1985\nDL987654321',
            faceMatchScore: 82,
            documentQuality: 88,
            livenessScore: 92
          },
          status: 'pending'
        }
      ];
      
      setApplications(mockApplications);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDecision = async (applicationId: string, decision: 'approved' | 'rejected') => {
    try {
      setProcessingReview(true);
      
      // In real implementation, this would call API to update application status
      console.log(`${decision} application ${applicationId} with note: ${reviewNote}`);
      
      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: decision }
            : app
        )
      );
      
      setSelectedApplication(null);
      setReviewNote('');
      
      // Show success message
      alert(`Application ${decision === 'approved' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error processing review:', error);
      alert('Error processing review. Please try again.');
    } finally {
      setProcessingReview(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <Check size={16} />;
      case 'rejected': return <X size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      nid: 'PNG National ID',
      drivers_license: "PNG Driver's License",
      png_passport: 'PNG Passport',
      international_passport: 'International Passport'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--muted)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px auto'
        }} />
        <p style={{ color: 'var(--muted-foreground)' }}>Loading applications...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAdmin) {
    return (
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
          🔒
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '16px' }}>
          Admin Access Required
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
          You need administrator privileges to access SevisPass application reviews.
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background)', 
      padding: '20px' 
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: 'var(--foreground)', 
            marginBottom: '8px' 
          }}>
            SevisPass Application Review
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
            Review and approve SevisPass registrations requiring manual verification
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          background: 'var(--muted)',
          padding: '4px',
          borderRadius: '8px',
          width: 'fit-content'
        }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: filter === status ? 'var(--background)' : 'transparent',
                color: filter === status ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize'
              }}
            >
              {status} ({applications.filter(app => status === 'all' ? true : app.status === status).length})
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
          {/* Applications List */}
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid var(--border)',
              background: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <User size={20} />
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--foreground)', margin: 0 }}>
                Applications ({filteredApplications.length})
              </h2>
            </div>

            {filteredApplications.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
                  No {filter === 'all' ? '' : filter + ' '}applications found
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: '800px', overflowY: 'auto' }}>
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApplication(app)}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      background: selectedApplication?.id === app.id ? 'var(--accent)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedApplication?.id !== app.id) {
                        e.currentTarget.style.background = 'var(--muted)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedApplication?.id !== app.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: getStatusColor(app.status) + '20',
                        color: getStatusColor(app.status),
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {getStatusIcon(app.status)}
                        {app.status.toUpperCase()}
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: 'var(--muted)',
                        color: 'var(--muted-foreground)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {app.confidenceScore}% Confidence
                      </div>
                    </div>
                    
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: 'var(--foreground)', 
                      marginBottom: '4px' 
                    }}>
                      {app.applicantName}
                    </h3>
                    
                    <p style={{ 
                      color: 'var(--muted-foreground)', 
                      fontSize: '14px', 
                      marginBottom: '8px' 
                    }}>
                      {getDocumentTypeLabel(app.documentType)} • {app.documentNumber}
                    </p>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)'
                    }}>
                      <span>App ID: {app.applicationId}</span>
                      <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Application Details */}
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            height: 'fit-content'
          }}>
            {selectedApplication ? (
              <>
                <div style={{ 
                  padding: '20px', 
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--muted)'
                }}>
                  <h2 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: 'var(--foreground)', 
                    marginBottom: '8px' 
                  }}>
                    Application Review
                  </h2>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: getStatusColor(selectedApplication.status) + '20',
                    color: getStatusColor(selectedApplication.status),
                    fontSize: '12px',
                    fontWeight: '600',
                    width: 'fit-content'
                  }}>
                    {getStatusIcon(selectedApplication.status)}
                    {selectedApplication.status.toUpperCase()}
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  {/* Applicant Info */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: 'var(--foreground)', 
                      marginBottom: '12px' 
                    }}>
                      Applicant Information
                    </h3>
                    <div style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                      <p><strong>Name:</strong> {selectedApplication.applicantName}</p>
                      <p><strong>Email:</strong> {selectedApplication.email}</p>
                      <p><strong>Phone:</strong> {selectedApplication.phoneNumber}</p>
                      <p><strong>Date of Birth:</strong> {new Date(selectedApplication.dateOfBirth).toLocaleDateString()}</p>
                      <p><strong>Document:</strong> {getDocumentTypeLabel(selectedApplication.documentType)}</p>
                      <p><strong>Document Number:</strong> {selectedApplication.documentNumber}</p>
                      <p><strong>Application ID:</strong> {selectedApplication.applicationId}</p>
                      <p><strong>Submitted:</strong> {new Date(selectedApplication.submittedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Verification Scores */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: 'var(--foreground)', 
                      marginBottom: '12px' 
                    }}>
                      Verification Scores
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                          Face Match Confidence
                        </span>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: '600',
                          color: selectedApplication.extractedInfo.faceMatchScore >= 90 ? 'var(--success)' : 
                                selectedApplication.extractedInfo.faceMatchScore >= 80 ? 'var(--warning)' : 'var(--destructive)'
                        }}>
                          {selectedApplication.extractedInfo.faceMatchScore}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                          Document Quality
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)' }}>
                          {selectedApplication.extractedInfo.documentQuality}%
                        </span>
                      </div>
                      {selectedApplication.extractedInfo.livenessScore && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                            Liveness Detection
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)' }}>
                            {selectedApplication.extractedInfo.livenessScore}%
                          </span>
                        </div>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 0',
                        borderTop: '1px solid var(--border)',
                        marginTop: '8px'
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)' }}>
                          Overall Score
                        </span>
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: '700',
                          color: selectedApplication.confidenceScore >= 90 ? 'var(--success)' : 
                                selectedApplication.confidenceScore >= 80 ? 'var(--warning)' : 'var(--destructive)'
                        }}>
                          {selectedApplication.confidenceScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document Images */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: 'var(--foreground)', 
                      marginBottom: '12px' 
                    }}>
                      Images
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
                          Document Photo
                        </p>
                        <div style={{
                          width: '100%',
                          height: '120px',
                          background: 'var(--muted)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border)'
                        }}>
                          <FileText size={32} style={{ color: 'var(--muted-foreground)' }} />
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
                          Selfie Photo
                        </p>
                        <div style={{
                          width: '100%',
                          height: '120px',
                          background: 'var(--muted)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border)'
                        }}>
                          <Camera size={32} style={{ color: 'var(--muted-foreground)' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Text */}
                  {selectedApplication.extractedInfo.documentText && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: 'var(--foreground)', 
                        marginBottom: '12px' 
                      }}>
                        Extracted Text
                      </h3>
                      <div style={{
                        background: 'var(--muted)',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: 'var(--muted-foreground)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedApplication.extractedInfo.documentText}
                      </div>
                    </div>
                  )}

                  {/* Review Actions */}
                  {selectedApplication.status === 'pending' && (
                    <div>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: 'var(--foreground)', 
                        marginBottom: '12px' 
                      }}>
                        Review Decision
                      </h3>
                      
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Add review notes (optional)..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '12px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          background: 'var(--input)',
                          color: 'var(--foreground)',
                          fontSize: '14px',
                          resize: 'vertical',
                          marginBottom: '16px'
                        }}
                      />
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleReviewDecision(selectedApplication.id, 'approved')}
                          disabled={processingReview}
                          style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            borderRadius: '8px',
                            background: processingReview ? '#9CA3AF' : 'var(--success)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: processingReview ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Check size={16} />
                          {processingReview ? 'Processing...' : 'Approve'}
                        </button>
                        
                        <button
                          onClick={() => handleReviewDecision(selectedApplication.id, 'rejected')}
                          disabled={processingReview}
                          style={{
                            flex: 1,
                            padding: '12px',
                            border: 'none',
                            borderRadius: '8px',
                            background: processingReview ? '#9CA3AF' : 'var(--destructive)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: processingReview ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <X size={16} />
                          {processingReview ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Eye size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>
                  Select an Application
                </h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
                  Choose an application from the list to review details and make a decision
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}