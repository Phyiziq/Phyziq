"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'MEMBER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (data.token) {
        localStorage.setItem('phyziq_token', data.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (Array.isArray(err.message)) {
        setError(err.message[0]?.message || 'Validation failed');
      } else {
        setError(err.message || 'Failed to register');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: '15px' };
  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--ink-soft)', marginBottom: '4px', fontFamily: 'var(--font-body)' };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '24px', color: 'var(--ink)', marginBottom: '24px', textAlign: 'center' }}>
        Create Account
      </h2>
      
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--trust-soft)', color: 'var(--trust)', borderRadius: 'var(--radius-s)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>First Name</label>
            <input 
              type="text" 
              required 
              style={inputStyle}
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Last Name</label>
            <input 
              type="text" 
              required 
              style={inputStyle}
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
        </div>
        
        <div>
          <label style={labelStyle}>Email</label>
          <input 
            type="email" 
            required 
            style={inputStyle}
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
        
        <div>
          <label style={labelStyle}>Password</label>
          <input 
            type="password" 
            required 
            style={inputStyle}
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            minLength={8}
          />
        </div>

        <div>
          <label style={labelStyle}>Account Type</label>
          <select 
            style={{ ...inputStyle, appearance: 'auto' }}
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
          >
            <option value="MEMBER">Member (Standard)</option>
            <option value="COACH">Coach / Trainer</option>
            <option value="GYM_OWNER">Gym Owner</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading} className="primary-btn" style={{ width: '100%', marginTop: '16px', padding: '12px', border: 'none', borderRadius: 'var(--radius-m)', backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', fontWeight: 600, fontSize: '15px', fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
          {loading ? 'Creating Profile...' : 'Join PHYZIQ'}
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}>
        Already have an account? <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Sign In</Link>
      </div>
    </div>
  );
}
