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
      // Backend returns Zod array of errors or simple string
      if (Array.isArray(err.message)) {
        setError(err.message[0]?.message || 'Validation failed');
      } else {
        setError(err.message || 'Failed to register');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8">
      <h2 className="text-2xl font-display font-bold mb-6 text-center">Create Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">First Name</label>
            <input 
              type="text" 
              required 
              className="input-field" 
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Last Name</label>
            <input 
              type="text" 
              required 
              className="input-field" 
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Email</label>
          <input 
            type="email" 
            required 
            className="input-field" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted mb-1">Password</label>
          <input 
            type="password" 
            required 
            className="input-field" 
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-1">Account Type</label>
          <select 
            className="input-field bg-background text-primary"
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
          >
            <option value="MEMBER">Member (Standard)</option>
            <option value="COACH">Coach / Trainer</option>
            <option value="GYM_OWNER">Gym Owner</option>
          </select>
        </div>
        
        <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
          {loading ? 'Creating Profile...' : 'Join PHYZIQ'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="text-accent hover:underline">Sign In</Link>
      </div>
    </div>
  );
}
