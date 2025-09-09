"use client";

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Eye, EyeOff, MapPin, Building2 } from 'lucide-react';

interface CityPassData {
  citypassId: string;
  fullName: string;
  category: string;
  issuedDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'suspended';
  sevispassUin: string;
  photo?: string; // Base64 image or URL
}

interface CityPassCardProps {
  data: CityPassData;
  showActions?: boolean;
}

export function CityPassCard({ data, showActions = true }: CityPassCardProps) {
  const [showDetails, setShowDetails] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Generate QR code data for verification
  const qrData = JSON.stringify({
    id: data.citypassId,
    citypassId: data.citypassId,
    name: data.fullName,
    category: data.category,
    issued: data.issuedDate,
    status: data.status,
    type: 'citypass',
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

  const formatCategory = (category: string) => {
    return category.replace('_', ' ').toUpperCase();
  };

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      // Dynamic imports to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      // Temporarily hide action buttons for clean screenshot
      const actionButtons = document.querySelector('[data-actions]') as HTMLElement;
      const originalDisplay = actionButtons?.style.display;
      if (actionButtons) {
        actionButtons.style.display = 'none';
      }
      
      // Wait longer for all elements to render properly
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Ensure all images are loaded
      const images = cardRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(null);
          } else {
            img.onload = () => resolve(null);
            img.onerror = () => resolve(null);
            // Timeout after 3 seconds
            setTimeout(() => resolve(null), 3000);
          }
        });
      }));
      
      // Capture the card as canvas with improved settings
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: true,
        scale: 3, // Higher resolution for better quality
        backgroundColor: '#ffffff', // White background instead of transparent
        width: cardRef.current.scrollWidth,
        height: cardRef.current.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: cardRef.current.scrollWidth,
        windowHeight: cardRef.current.scrollHeight
      } as any);
      
      // Restore action buttons
      if (actionButtons && originalDisplay !== undefined) {
        actionButtons.style.display = originalDisplay;
      }
      
      // Check if canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas is empty - failed to capture card content');
      }
      
      // Create PDF with better dimensions
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG for smaller file size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions to fit nicely on page with margins
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);
      
      // Calculate scaled dimensions maintaining aspect ratio
      const aspectRatio = canvas.width / canvas.height;
      let imgWidth = availableWidth;
      let imgHeight = imgWidth / aspectRatio;
      
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * aspectRatio;
      }
      
      // Center the image
      const xPosition = (pageWidth - imgWidth) / 2;
      const yPosition = (pageHeight - imgHeight) / 2;
      
      pdf.addImage(imgData, 'JPEG', xPosition, yPosition, imgWidth, imgHeight);
      
      // Add document title
      pdf.setFontSize(16);
      pdf.text('CityPass - Port Moresby Resident Credential', margin, margin);
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, margin + 7);
      
      // Save the PDF
      pdf.save(`CityPass-${data.citypassId}-${Date.now()}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download CityPass. Please try again. Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My CityPass',
          text: `CityPass for ${data.fullName} - Port Moresby Resident`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Sharing cancelled or failed');
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('CityPass link copied to clipboard!');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* CityPass Card */}
      <div
        ref={cardRef}
        style={{
          width: '100%',
          maxWidth: '450px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, #FFD700 0%, #FFC107 30%, #000000 100%)',
          borderRadius: '20px',
          padding: '2px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Inner Card Content */}
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FFD700 50%, #1F1F1F 100%)',
          borderRadius: '18px',
          padding: '24px',
          position: 'relative',
          minHeight: '280px'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(50px, -50px)'
          }}></div>

          {/* City Pass Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 2
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Building2 size={24} style={{ color: '#000' }} />
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: '#000',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Port Moresby
                </h3>
              </div>
              <p style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#000',
                margin: 0,
                textShadow: '0 1px 2px rgba(255,255,255,0.5)'
              }}>
                CITYPASS
              </p>
            </div>

            {/* Status Badge */}
            <div style={{
              background: getStatusColor(data.status),
              color: 'white',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              {getStatusText(data.status)}
            </div>
          </div>

          {/* Card Content */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            position: 'relative',
            zIndex: 2
          }}>
            {/* Left Side - Info */}
            <div style={{ flex: 1 }}>
              {/* Photo Placeholder */}
              {data.photo ? (
                <img
                  src={data.photo}
                  alt="CityPass Photo"
                  crossOrigin="anonymous"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '3px solid #000',
                    marginBottom: '16px'
                  }}
                  onError={(e) => {
                    console.log('CityPass photo failed to load:', data.photo);
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement!;
                    const placeholder = parent.querySelector('.photo-placeholder') as HTMLElement;
                    if (placeholder) {
                      placeholder.style.display = 'flex';
                    }
                  }}
                  onLoad={() => {
                    console.log('CityPass photo loaded successfully:', data.photo);
                  }}
                />
              ) : null}
              
              <div className="photo-placeholder" style={{
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '3px solid #000',
                display: data.photo ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '12px', color: '#000' }}>PHOTO</span>
              </div>

              {showDetails ? (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#000',
                      margin: '0 0 2px 0',
                      opacity: 0.8
                    }}>
                      RESIDENT NAME
                    </p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#000',
                      margin: 0,
                      textTransform: 'uppercase'
                    }}>
                      {data.fullName}
                    </p>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#000',
                      margin: '0 0 2px 0',
                      opacity: 0.8
                    }}>
                      CATEGORY
                    </p>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#000',
                      margin: 0
                    }}>
                      {formatCategory(data.category)}
                    </p>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#000',
                      margin: '0 0 2px 0',
                      opacity: 0.7
                    }}>
                      CITYPASS ID: {data.citypassId}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#000',
                      margin: '0 0 2px 0',
                      opacity: 0.7
                    }}>
                      ISSUED: {new Date(data.issuedDate).toLocaleDateString()}
                    </p>
                  </div>
                </>
              ) : (
                <div style={{
                  padding: '40px 0',
                  textAlign: 'center'
                }}>
                  <EyeOff size={32} style={{ color: '#000', opacity: 0.5 }} />
                  <p style={{
                    fontSize: '14px',
                    color: '#000',
                    marginTop: '8px',
                    opacity: 0.7
                  }}>
                    Details Hidden
                  </p>
                </div>
              )}
            </div>

            {/* Right Side - QR Code */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                background: 'white',
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #000'
              }}>
                <QRCodeSVG
                  value={qrData}
                  size={100}
                  level="H"
                  includeMargin={false}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <p style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#000',
                textAlign: 'center',
                margin: 0,
                opacity: 0.8
              }}>
                SCAN TO VERIFY
              </p>
            </div>
          </div>

          {/* Papua New Guinea branding */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '24px',
            fontSize: '10px',
            fontWeight: '600',
            color: '#000',
            opacity: 0.6,
            letterSpacing: '0.5px'
          }}>
            PAPUA NEW GUINEA • GOVT ISSUED
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div
          data-actions
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '24px',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--card)',
              border: '2px solid #FFD700',
              borderRadius: '10px',
              color: 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFD700';
              e.currentTarget.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
          >
            {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#FFD700',
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              cursor: isDownloading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              opacity: isDownloading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isDownloading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Download size={16} />
            {isDownloading ? 'Generating PDF...' : 'Download PDF'}
          </button>

          <button
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--foreground)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card)';
            }}
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      )}
    </div>
  );
}