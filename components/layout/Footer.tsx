export function Footer() {
  return (
    <footer style={{ background: 'var(--muted)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
      <div className="container" style={{ padding: '32px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
          <div>
            <h3 className="font-semibold text-lg" style={{ marginBottom: '16px' }}>SevisPortal Enhanced</h3>
            <p className="text-sm" style={{ marginBottom: '16px', color: 'var(--muted-foreground)' }}>
              Papua New Guinea's comprehensive digital government platform providing citizens with seamless access to essential government services.
            </p>
            <div className="png-flag-accent" style={{ width: '60px', height: '4px' }}></div>
          </div>
          
          <div>
            <h4 className="font-medium" style={{ marginBottom: '12px' }}>Services</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="/sevispass/apply" className="text-sm">SevisPass Application</a></li>
              <li><a href="/citypass/apply" className="text-sm">CityPass Application</a></li>
              <li><a href="/health/mrn/apply" className="text-sm">Medical Record Number</a></li>
              <li><a href="/nicta/sim/register" className="text-sm">SIM Registration</a></li>
              <li><a href="/verify" className="text-sm">Identity Verification</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium" style={{ marginBottom: '12px' }}>Support</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="/help" className="text-sm">Help Center</a></li>
              <li><a href="/contact" className="text-sm">Contact Us</a></li>
              <li><a href="/privacy" className="text-sm">Privacy Policy</a></li>
              <li><a href="/terms" className="text-sm">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium" style={{ marginBottom: '12px' }}>Government</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="https://dict.gov.pg" className="text-sm">DICT</a></li>
              <li><a href="https://gov.pg" className="text-sm">Government Portal</a></li>
              <li><a href="/accessibility" className="text-sm">Accessibility</a></li>
            </ul>
          </div>
        </div>
        
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            © 2025 Government of Papua New Guinea. All rights reserved.
          </p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Department of Information and Communications Technology
          </p>
        </div>
      </div>
    </footer>
  );
}