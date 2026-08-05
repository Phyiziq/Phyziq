import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '32px', color: 'var(--accent)' }}>~</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '32px', color: 'var(--ink)', letterSpacing: '-.01em', margin: 0 }}>
            Adaptive
          </h1>
        </Link>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-soft)', marginTop: '8px' }}>
          A fitness plan that adjusts to you.
        </p>
      </div>
      
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-l)', padding: '32px', boxShadow: '0 4px 24px rgba(36,31,26,.05)' }}>
        {children}
      </div>
    </div>
  );
}
