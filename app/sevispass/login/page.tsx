"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SevisPassLogin } from '@/components/sevispass/SevisPassLogin';
import { ArrowLeft } from 'lucide-react';

export default function SevisPassLoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (userData: { uin: string; fullName?: string }) => {
    console.log('SevisPass authentication successful:', userData);
    router.push('/dashboard');
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'var(--background)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      {/* Theme Toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Back Button */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100 }}>
        <button
          onClick={() => router.push('/auth')}
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
          Back to Login Options
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
        width: '100%',
        maxWidth: '500px'
      }}>
        <SevisPassLogin
          onSuccess={handleLoginSuccess}
          onCancel={() => router.push('/auth')}
        />
      </div>
    </div>
  );
}