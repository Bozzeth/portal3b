"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Clock, XCircle, ExternalLink, Eye, FileText, Calendar } from 'lucide-react';

interface ApplicationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    uin?: string;
    applicationId?: string;
    status: 'approved' | 'pending' | 'rejected';
    submittedAt?: string;
    expectedReviewTime?: string;
    rejectionReason?: string;
    fullName?: string;
    documentType?: string;
  };
}

export function ApplicationSuccessModal({ isOpen, onClose, data }: ApplicationSuccessModalProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleViewSevisPass = () => {
    handleClose();
    setTimeout(() => {
      router.push('/sevispass/view');
    }, 300);
  };

  const handleGoToDashboard = () => {
    handleClose();
    setTimeout(() => {
      router.push('/dashboard');
    }, 300);
  };

  const getStatusConfig = () => {
    switch (data.status) {
      case 'approved':
        return {
          icon: <CheckCircle size={64} />,
          iconColor: '#10b981',
          title: 'SevisPass Approved!',
          titleColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          description: 'Congratulations! Your SevisPass has been approved and is ready to use.',
          primaryAction: 'View My SevisPass',
          primaryActionHandler: handleViewSevisPass,
        };
      case 'pending':
        return {
          icon: <Clock size={64} />,
          iconColor: '#f59e0b',
          title: 'Application Under Review',
          titleColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          description: 'Your application has been submitted successfully and is being reviewed by our verification team.',
          primaryAction: 'Go to Dashboard',
          primaryActionHandler: handleGoToDashboard,
        };
      case 'rejected':
        return {
          icon: <XCircle size={64} />,
          iconColor: '#ef4444',
          title: 'Application Rejected',
          titleColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          description: 'Unfortunately, your application could not be approved at this time.',
          primaryAction: 'Try Again',
          primaryActionHandler: handleClose,
        };
      default:
        return {
          icon: <FileText size={64} />,
          iconColor: 'var(--muted-foreground)',
          title: 'Application Submitted',
          titleColor: 'var(--foreground)',
          backgroundColor: 'var(--muted)',
          borderColor: 'var(--border)',
          description: 'Your application has been submitted.',
          primaryAction: 'Continue',
          primaryActionHandler: handleClose,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
          opacity: isClosing ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${isClosing ? 0.95 : 1})`,
        background: 'var(--card)',
        borderRadius: '16px',
        padding: '0',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        zIndex: 1001,
        border: '1px solid var(--border)',
        opacity: isClosing ? 0 : 1,
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          padding: '48px 32px 32px 32px',
          background: statusConfig.backgroundColor,
          border: `2px solid ${statusConfig.borderColor}`,
          borderBottom: 'none',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}>
          <div style={{ 
            color: statusConfig.iconColor, 
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
          }}>
            {statusConfig.icon}
          </div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            marginBottom: '12px',
            color: statusConfig.titleColor,
            margin: '0 0 12px 0',
          }}>
            {statusConfig.title}
          </h2>
          <p style={{ 
            color: 'var(--muted-foreground)', 
            fontSize: '16px',
            lineHeight: '1.5',
            margin: '0',
          }}>
            {statusConfig.description}
          </p>
        </div>

        {/* Details */}
        <div style={{ padding: '32px' }}>
          <div style={{
            background: 'var(--muted)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: 'var(--foreground)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <FileText size={20} />
              Application Details
            </h3>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {data.status === 'approved' && data.uin && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--foreground)' }}>UIN:</strong>{' '}
                  <span style={{ 
                    fontFamily: 'monospace', 
                    background: 'var(--card)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: 'var(--foreground)',
                  }}>
                    {data.uin}
                  </span>
                </div>
              )}
              {data.applicationId && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--foreground)' }}>Application ID:</strong>{' '}
                  <span style={{ 
                    fontFamily: 'monospace', 
                    background: 'var(--card)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: 'var(--foreground)',
                  }}>
                    {data.applicationId}
                  </span>
                </div>
              )}
              {data.fullName && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--foreground)' }}>Name:</strong>{' '}
                  <span style={{ color: 'var(--muted-foreground)' }}>{data.fullName}</span>
                </div>
              )}
              {data.documentType && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--foreground)' }}>Document Type:</strong>{' '}
                  <span style={{ color: 'var(--muted-foreground)' }}>{data.documentType}</span>
                </div>
              )}
              {data.submittedAt && (
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} style={{ color: 'var(--muted-foreground)' }} />
                  <strong style={{ color: 'var(--foreground)' }}>Submitted:</strong>{' '}
                  <span style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(data.submittedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              {data.status === 'pending' && data.expectedReviewTime && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--foreground)' }}>Expected Review Time:</strong>{' '}
                  <span style={{ color: 'var(--muted-foreground)' }}>{data.expectedReviewTime}</span>
                </div>
              )}
              {data.status === 'rejected' && data.rejectionReason && (
                <div style={{ marginTop: '16px' }}>
                  <strong style={{ color: 'var(--destructive)' }}>Rejection Reason:</strong>
                  <div style={{ 
                    marginTop: '8px',
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: 'var(--foreground)',
                  }}>
                    {data.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={handleClose}
              style={{
                padding: '12px 20px',
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--muted)';
              }}
            >
              Close
            </button>
            
            <button
              onClick={statusConfig.primaryActionHandler}
              style={{
                padding: '12px 20px',
                background: data.status === 'approved' 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : data.status === 'pending'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {data.status === 'approved' && <Eye size={16} />}
              {data.status === 'pending' && <ExternalLink size={16} />}
              {statusConfig.primaryAction}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}