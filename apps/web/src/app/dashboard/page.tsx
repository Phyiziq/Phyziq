"use client";

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import Chip from '@/components/Chip';

const todayItems: { dot: string; title: string; meta: string; time: string; chip: 'trust' | 'estimated' | null }[] = [
  { dot: 'trust', title: 'Upper body — moderate', meta: '4 exercises · 32 min', time: '7:10 AM', chip: null },
  { dot: 'gray', title: 'Lunch — grilled tilapia, sukuma wiki, ugali', meta: '612 kcal · balanced for your BP-aware plan', time: '', chip: 'estimated' },
  { dot: 'gray', title: 'Evening walk — 20 min', meta: 'Recovery day, low intensity', time: '6:30 PM', chip: null },
];

const recentLogs = [
  { title: 'Breakfast — mandazi & tea', meta: 'Photo-logged · tap to confirm estimate', chip: 'estimated' as const },
  { title: 'Upper body — moderate', meta: 'Logged manually · all sets completed', chip: 'trust' as const },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await fetchApi('/users/me');
        setProfile(userRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ color: 'var(--ink)' }}>Loading your plan...</div>
      </div>
    );
  }

  const firstName = profile?.firstName || 'Athlete';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Left column */}
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '26px', color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '4px' }}>
              Good morning, {firstName}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'var(--ink-soft)' }}>Thursday — your plan shifted after Wednesday's missed session</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px', color: 'var(--accent-ink)', flexShrink: 0 }}>
            {initial}
          </div>
        </div>

        {/* Adaptive banner */}
        <div style={{ background: 'linear-gradient(to right, rgba(184,84,46,.14), transparent)', border: '1px solid rgba(184,84,46,.3)', borderRadius: 'var(--radius-s)', padding: '14px 16px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--accent)', fontSize: '10px', marginTop: '2px' }}>●</span>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Adjusted</strong> — Today's session is shorter than planned. Lower-body volume moved to Saturday so you're not stacking fatigue two days running.
          </p>
        </div>

        {/* Today's plan */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>Today's plan</p>
          <Chip variant="trust" label="High confidence" />
        </div>
        
        {/* Plan items */}
        <div style={{ backgroundColor: 'var(--bg-raised)', borderRadius: 'var(--radius-m)', border: '1px solid var(--line)', overflow: 'hidden', marginBottom: '24px' }}>
          {todayItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: i < todayItems.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.dot === 'trust' ? 'var(--trust)' : '#E0DCD1', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 500, color: 'var(--ink)', marginBottom: '2px' }}>{item.title}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--ink-soft)' }}>{item.meta}</p>
              </div>
              {item.time && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-soft)', flexShrink: 0 }}>{item.time}</span>}
              {item.chip !== null && <Chip variant={item.chip} label={item.chip === 'trust' ? 'Confirmed' : 'Estimated'} />}
            </div>
          ))}
        </div>

        {/* Recent logs */}
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: 'var(--ink)', marginBottom: '12px' }}>Recent logs</p>
        <div style={{ backgroundColor: 'var(--bg-raised)', borderRadius: 'var(--radius-m)', border: '1px solid var(--line)', overflow: 'hidden' }}>
          {recentLogs.map((log, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: i < recentLogs.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 500, color: 'var(--ink)', marginBottom: '2px' }}>{log.title}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--ink-soft)' }}>{log.meta}</p>
              </div>
              <Chip variant={log.chip} label={log.chip === 'trust' ? 'Confirmed' : 'Estimated'} />
            </div>
          ))}
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* This week card */}
        <div style={{ backgroundColor: 'var(--bg-raised)', borderRadius: 'var(--radius-m)', border: '1px solid var(--line)', padding: '20px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', color: 'var(--ink)', marginBottom: '16px' }}>This week</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Donut ring */}
            <svg width="70" height="70" viewBox="0 0 70 70" style={{ flexShrink: 0 }}>
              <circle cx="35" cy="35" r="28" stroke="var(--line)" strokeWidth="8" fill="none" />
              <circle cx="35" cy="35" r="28" stroke="var(--trust)" strokeWidth="8" fill="none" strokeDasharray="105 71" strokeLinecap="round" transform="rotate(-90 35 35)" />
            </svg>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '22px', color: 'var(--ink)', letterSpacing: '-.01em' }}>4/5</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-soft)', marginBottom: '4px' }}>SESSIONS</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--accent)' }}>2 ADJUSTED</p>
            </div>
          </div>
        </div>
        
        {/* Coach card */}
        <div style={{ backgroundColor: 'var(--bg-raised)', borderRadius: 'var(--radius-m)', border: '1px solid var(--line)', padding: '20px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--ink-soft)', marginBottom: '10px' }}>COACH</p>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            "You're holding your Wednesday pattern — this is the third week you've had a mid-week miss. Let's look at your schedule and redistribute load to avoid it becoming structural."
          </p>
        </div>
      </div>

    </div>
  );
}
