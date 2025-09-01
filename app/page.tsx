"use client";

import { Footer } from "@/components/layout/Footer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useState } from 'react';

export default function LandingPage() {
  const [showSevisLogin, setShowSevisLogin] = useState(false);
  const [uin, setUin] = useState('');

  const handleSevisPassLogin = () => {
    setShowSevisLogin(true);
  };

  const handleUinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uin.trim()) {
      // Future: Open camera for facial verification
      alert(`Future: Opening camera for facial verification with UIN: ${uin}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', position: 'relative' }}>
      {/* Theme Toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Subtle Background Pattern */}
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

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Hero Section */}
        <section style={{ 
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--background)',
          color: 'var(--foreground)',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '4px', 
            background: 'linear-gradient(90deg, #DC2626 0%, #FCD34D 100%)' 
          }}></div>
          
          <div className="container" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ marginBottom: '60px' }}>
              <h1 style={{ 
                fontSize: 'clamp(40px, 6vw, 64px)', 
                fontWeight: '700', 
                marginBottom: '16px',
                letterSpacing: '-0.01em',
                color: 'var(--foreground)'
              }}>
                SevisPortal
              </h1>
              <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', marginBottom: '12px', fontWeight: '400', opacity: 0.9, color: 'var(--foreground)' }}>
                Papua New Guinea Digital Government Platform
              </p>
              <p style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', opacity: 0.8, maxWidth: '600px', margin: '0 auto', lineHeight: 1.5, color: 'var(--muted-foreground)' }}>
                Secure access to government services and digital identity verification
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
              <a 
                href="/auth"
                style={{ 
                  background: 'var(--primary)',
                  color: 'var(--background)',
                  fontSize: '16px',
                  padding: '14px 28px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--primary)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--background)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
              >
                Get Started
              </a>
              <button 
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  fontSize: '16px',
                  padding: '14px 28px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleSevisPassLogin}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                Login with SevisPass
              </button>
            </div>

            {/* Feature Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxWidth: '700px', margin: '0 auto' }}>
              {[
                { title: 'Digital Identity', desc: 'Biometric verification' },
                { title: 'City Services', desc: 'Resident credentials' },
                { title: 'Instant Access', desc: 'Real-time processing' }
              ].map((feature, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '20px 16px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px', color: 'var(--foreground)' }}>{feature.title}</h3>
                  <p style={{ fontSize: '14px', opacity: 0.7, color: 'var(--muted-foreground)' }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section style={{ padding: '80px 0', background: 'var(--background)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '600', marginBottom: '12px', color: 'var(--foreground)' }}>
                Government Service Platform
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--muted-foreground)', maxWidth: '500px', margin: '0 auto' }}>
                Secure, reliable access to essential services
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '40px', maxWidth: '800px', margin: '0 auto' }}>
              {[
                { value: '90%+', label: 'Approval Rate' },
                { value: '<5min', label: 'Processing' },
                { value: '99.9%', label: 'Uptime' },
                { value: '24/7', label: 'Available' }
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>
                    {stat.value}
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: '400', color: 'var(--muted-foreground)' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* SevisPass Login Modal */}
      {showSevisLogin && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--card)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: 'var(--foreground)' }}>
              Login with SevisPass
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginBottom: '32px' }}>
              Enter your UIN for facial verification
            </p>
            
            <form onSubmit={handleUinSubmit}>
              <input
                type="text"
                placeholder="Enter your UIN"
                value={uin}
                onChange={(e) => setUin(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  marginBottom: '24px',
                  background: 'var(--input)',
                  color: 'var(--foreground)'
                }}
              />
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowSevisLogin(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: '2px solid var(--border)',
                    borderRadius: '12px',
                    background: 'transparent',
                    color: 'var(--foreground)',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}