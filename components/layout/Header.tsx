'use client';

import { useAuth } from '@/components/auth/AuthWrapper';
import { useState } from 'react';

export function Header() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header>
      <div className="png-flag-accent"></div>
      <div className="png-header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="text-2xl font-bold">SevisPortal Enhanced</h1>
              <p className="text-sm opacity-90">Papua New Guinea Digital Government Platform</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {user && (
                <>
                  <div style={{ textAlign: 'right' }}>
                    <p className="font-medium">{user.givenName} {user.familyName}</p>
                    <p className="text-sm opacity-75">{user.userRole}</p>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="btn-secondary"
                      style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                    >
                      Menu
                    </button>
                    
                    {isMenuOpen && (
                      <div 
                        className="card"
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: '8px',
                          minWidth: '200px',
                          zIndex: 50,
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <a href="/dashboard" style={{ padding: '8px', borderRadius: '4px', transition: 'background 0.2s' }}>
                            Dashboard
                          </a>
                          <a href="/profile" style={{ padding: '8px', borderRadius: '4px', transition: 'background 0.2s' }}>
                            Profile
                          </a>
                          {user.userRole === 'DICT_OFFICER' && (
                            <a href="/admin" style={{ padding: '8px', borderRadius: '4px', transition: 'background 0.2s' }}>
                              Admin Panel
                            </a>
                          )}
                          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                          <button
                            onClick={() => {
                              signOut();
                              setIsMenuOpen(false);
                              window.location.href = '/';
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '8px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              color: 'var(--destructive)',
                            }}
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {user && (
        <nav style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div style={{ display: 'flex', gap: '32px', padding: '16px 0' }}>
              <a href="/dashboard" className="font-medium">Dashboard</a>
              <a href="/sevispass/apply" className="font-medium">Apply for SevisPass</a>
              <a href="/citypass/apply" className="font-medium">Apply for CityPass</a>
              <a href="/health/mrn/apply" className="font-medium">Health MRN</a>
              <a href="/nicta/sim/register" className="font-medium">SIM Registration</a>
              <a href="/verify" className="font-medium">Verify Identity</a>
              {(user.userRole === 'CITIZEN' || user.userRole === 'ORG_VOUCHER') && user.sevispassUin && (
                <a href="/resident/vouch" className="font-medium">Vouching</a>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}