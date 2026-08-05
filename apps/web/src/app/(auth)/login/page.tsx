"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (data.token) {
        localStorage.setItem('phyziq_token', data.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '24px', color: 'var(--ink)', marginBottom: '24px', textAlign: 'center' }}>
        Welcome Back
      </h2>
      
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--trust-soft)', color: 'var(--trust)', borderRadius: 'var(--radius-s)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Email</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '15px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '4px', fontFamily: 'var(--font-body)' }}>Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '15px' }}
          />
        </div>
        
        <button type="submit" disabled={loading} className="primary-btn" style={{ width: '100%', marginTop: '16px', padding: '12px', border: 'none', borderRadius: 'var(--radius-m)', backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 600, fontSize: '15px', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}>
        Don't have an account? <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Register here</Link>
      </div>
    </div>
  );
}
