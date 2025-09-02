"use client";

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Eye, EyeOff } from 'lucide-react';

interface SevisPassData {
  uin: string;
  fullName: string;
  dateOfBirth?: string;
  issuedDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'suspended';
  photo?: string; // Base64 image or URL
}

interface SevisPassCardProps {
  data: SevisPassData;
  showActions?: boolean;
}

export function SevisPassCard({ data, showActions = true }: SevisPassCardProps) {
  const [showDetails, setShowDetails] = useState(true);
  
  // Generate QR code data for verification
  const qrData = JSON.stringify({
    uin: data.uin,
    name: data.fullName,
    issued: data.issuedDate,
    status: data.status,
    type: 'sevispass',
    version: '1.0'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'expired': return '#F59E0B';
      case 'suspended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'ACTIVE';
      case 'expired': return 'EXPIRED';
      case 'suspended': return 'SUSPENDED';
      default: return 'UNKNOWN';
    }
  };

  const handleDownload = () => {
    // Create a canvas and render the card for download
    alert('Download functionality would generate a PDF/PNG of the SevisPass card');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My SevisPass',
        text: `My PNG Digital Identity - UIN: ${data.uin}`,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`My SevisPass UIN: ${data.uin}\nVerify at: ${window.location.origin}/verify`);
      alert('SevisPass details copied to clipboard!');
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      {/* Card Container */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%)',
        borderRadius: '20px',
        padding: '32px',
        color: 'white',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '350px'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          filter: 'blur(30px)'
        }} />

        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '24px',
          position: 'relative',
          zIndex: 2
        }}>
          <div>
            <div style={{ 
              background: 'linear-gradient(90deg, #DC2626 0%, #FCD34D 100%)',
              height: '4px',
              width: '60px',
              marginBottom: '12px',
              borderRadius: '2px'
            }}></div>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              margin: '0 0 4px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              SevisPass
            </h2>
            <p style={{ 
              fontSize: '12px', 
              margin: 0, 
              opacity: 0.9,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Papua New Guinea Digital Identity
            </p>
          </div>
          
          <div style={{
            background: getStatusColor(data.status),
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {getStatusText(data.status)}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr auto', 
          gap: '32px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          {/* User Information */}
          <div>
            {/* Profile Photo Placeholder */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              background: data.photo ? `url(${data.photo})` : 'rgba(255, 255, 255, 0.2)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              marginBottom: '20px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              {!data.photo && '👤'}
            </div>
            
            {showDetails ? (
              <div>
                <h3 style={{ 
                  fontSize: '28px', 
                  fontWeight: '700', 
                  margin: '0 0 8px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {data.fullName}
                </h3>
                
                <div style={{ fontSize: '14px', opacity: 0.9, lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>UIN:</strong> {data.uin}
                  </div>
                  {data.dateOfBirth && (
                    <div style={{ marginBottom: '4px' }}>
                      <strong>DOB:</strong> {new Date(data.dateOfBirth).toLocaleDateString()}
                    </div>
                  )}
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Issued:</strong> {new Date(data.issuedDate).toLocaleDateString()}
                  </div>
                  {data.expiryDate && (
                    <div>
                      <strong>Expires:</strong> {new Date(data.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔒</div>
                <p style={{ margin: 0, fontSize: '14px' }}>Details Hidden</p>
              </div>
            )}
          </div>

          {/* QR Code */}
          <div style={{
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <QRCodeSVG
              value={qrData}
              size={120}
              level="M"
              includeMargin={false}
              bgColor="white"
              fgColor="#000000"
            />
            <p style={{
              color: '#666',
              fontSize: '10px',
              textAlign: 'center',
              margin: '8px 0 0 0',
              fontWeight: '500'
            }}>
              SCAN TO VERIFY
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          opacity: 0.8,
          position: 'relative',
          zIndex: 2
        }}>
          <div>
            <p style={{ margin: 0 }}>Government of Papua New Guinea</p>
            <p style={{ margin: 0 }}>Department of ICT • Digital Identity</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0 }}>Secure • Verified • Trusted</p>
            <p style={{ margin: 0, fontSize: '10px' }}>ID: {data.uin.slice(-8)}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '24px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--card)',
              border: '2px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.background = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--card)';
            }}
          >
            {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          <button
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Share2 size={16} />
            Share
          </button>

          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--success)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Download size={16} />
            Download
          </button>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        background: 'var(--muted)',
        borderRadius: '12px',
        fontSize: '14px',
        color: 'var(--muted-foreground)',
        lineHeight: '1.5'
      }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--foreground)' }}>
          💡 How to use your SevisPass
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Show this digital card when accessing government services</li>
          <li>Share the QR code for identity verification at service points</li>
          <li>Others can verify your identity by scanning the QR code at <strong>/verify</strong></li>
          <li>Keep your UIN secure - it's your unique digital identity</li>
          <li>Download or screenshot this card for offline access</li>
        </ul>
      </div>
    </div>
  );
}

// Hook to check if QR code library is available
export function useQRCode() {
  const [isAvailable, setIsAvailable] = useState(false);
  
  useState(() => {
    // Check if qrcode.react is available
    try {
      require('qrcode.react');
      setIsAvailable(true);
    } catch {
      setIsAvailable(false);
    }
  });
  
  return isAvailable;
}