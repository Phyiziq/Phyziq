import React from 'react'
import Chip from './Chip'

const sidebarNav = [
  { label: 'Today', active: true },
  { label: 'Plans', active: false },
  { label: 'Coach', active: false },
  { label: 'Marketplace', active: false },
  { label: 'Progress', active: false },
  { label: 'Account', active: false },
]

const todayItems: { dot: string; title: string; meta: string; time: string; chip: 'trust' | 'estimated' | null }[] = [
  { dot: 'trust', title: 'Upper body — moderate', meta: '4 exercises · 32 min', time: '7:10 AM', chip: null },
  { dot: 'gray', title: 'Lunch — grilled tilapia, sukuma wiki, ugali', meta: '612 kcal · balanced for your BP-aware plan', time: '', chip: 'estimated' },
  { dot: 'gray', title: 'Evening walk — 20 min', meta: 'Recovery day, low intensity', time: '6:30 PM', chip: null },
]

const recentLogs = [
  { title: 'Breakfast — mandazi & tea', meta: 'Photo-logged · tap to confirm estimate', chip: 'estimated' as const },
  { title: 'Upper body — moderate', meta: 'Logged manually · all sets completed', chip: 'trust' as const },
]

function Sidebar() {
  return (
    <div style={{ width: '240px', flexShrink: 0, backgroundColor: '#191512', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--dark-line)' }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--dark-line)' }}>
        <span style={{ fontSize: '18px', color: 'var(--accent)', marginRight: '6px' }}>~</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--dark-ink)' }}>Adaptive</span>
      </div>
      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {sidebarNav.map((item) => (
          <a
            key={item.label}
            href="#"
            style={{
              display: 'block',
              padding: '10px 20px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: item.active ? 600 : 400,
              color: item.active ? 'var(--dark-ink)' : '#A79E8F',
              textDecoration: 'none',
              backgroundColor: item.active ? '#2A231C' : 'transparent',
              borderLeft: item.active ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'background-color .15s',
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      {/* Gym info card */}
      <div style={{ margin: '12px', backgroundColor: '#241E17', borderRadius: 'var(--radius-m)', padding: '14px', border: '1px solid var(--dark-line)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--accent)', marginBottom: '4px' }}>SmartGym — Kilimani</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#A79E8F', lineHeight: 1.5 }}>Member since Jun 2026 · plan linked to your gym schedule</p>
      </div>
    </div>
  )
}

function MainContent() {
  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
      {/* Left column */}
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '26px', color: 'var(--dark-ink)', letterSpacing: '-.01em', marginBottom: '4px' }}>Good morning, Amina</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: '#A79E8F' }}>Thursday — your plan shifted after Wednesday&apos;s missed session</p>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px', color: 'var(--accent-ink)', flexShrink: 0 }}>A</div>
        </div>
        {/* Adaptive banner */}
        <div style={{ background: 'linear-gradient(to right, rgba(184,84,46,.14), transparent)', border: '1px solid rgba(184,84,46,.3)', borderRadius: 'var(--radius-s)', padding: '14px 16px', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--accent)', fontSize: '10px', marginTop: '2px' }}>●</span>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#A79E8F', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--dark-ink)', fontWeight: 600 }}>Adjusted</strong> — Today&apos;s session is shorter than planned. Lower-body volume moved to Saturday so you&apos;re not stacking fatigue two days running.
          </p>
        </div>
        {/* Today's plan */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: 'var(--dark-ink)' }}>Today&apos;s plan</p>
          <Chip variant="trust" label="High confidence" />
        </div>
        {/* Plan items */}
        <div style={{ backgroundColor: 'var(--dark-raised)', borderRadius: 'var(--radius-m)', border: '1px solid var(--dark-line)', overflow: 'hidden', marginBottom: '24px' }}>
          {todayItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: i < todayItems.length - 1 ? '1px solid var(--dark-line)' : 'none' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.dot === 'trust' ? 'var(--trust)' : '#5C5449', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 500, color: 'var(--dark-ink)', marginBottom: '2px' }}>{item.title}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#A79E8F' }}>{item.meta}</p>
              </div>
              {item.time && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A79E8F', flexShrink: 0 }}>{item.time}</span>}
              {item.chip !== null && <Chip variant={item.chip} label={item.chip === 'trust' ? 'Confirmed' : 'Estimated'} />}
            </div>
          ))}
        </div>

        {/* Recent logs */}
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: 'var(--dark-ink)', marginBottom: '12px' }}>Recent logs</p>
        <div style={{ backgroundColor: 'var(--dark-raised)', borderRadius: 'var(--radius-m)', border: '1px solid var(--dark-line)', overflow: 'hidden' }}>
          {recentLogs.map((log, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderBottom: i < recentLogs.length - 1 ? '1px solid var(--dark-line)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 500, color: 'var(--dark-ink)', marginBottom: '2px' }}>{log.title}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#A79E8F' }}>{log.meta}</p>
              </div>
              <Chip variant={log.chip} label={log.chip === 'trust' ? 'Confirmed' : 'Estimated'} />
            </div>
          ))}
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* This week card */}
        <div style={{ backgroundColor: 'var(--dark-raised)', borderRadius: 'var(--radius-m)', border: '1px solid var(--dark-line)', padding: '20px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', color: 'var(--dark-ink)', marginBottom: '16px' }}>This week</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Donut ring */}
            <svg width="70" height="70" viewBox="0 0 70 70" style={{ flexShrink: 0 }}>
              <circle cx="35" cy="35" r="28" stroke="var(--dark-line)" strokeWidth="8" fill="none" />
              <circle cx="35" cy="35" r="28" stroke="var(--trust)" strokeWidth="8" fill="none" strokeDasharray="105 71" strokeLinecap="round" transform="rotate(-90 35 35)" />
            </svg>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '22px', color: 'var(--dark-ink)', letterSpacing: '-.01em' }}>4/5</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: '#A79E8F', marginBottom: '4px' }}>SESSIONS</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--accent)' }}>2 ADJUSTED</p>
            </div>
          </div>
        </div>
        {/* Coach card */}
        <div style={{ backgroundColor: 'var(--dark-raised)', borderRadius: 'var(--radius-m)', border: '1px solid var(--dark-line)', padding: '20px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: '#A79E8F', marginBottom: '10px' }}>COACH</p>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '13.5px', color: '#A79E8F', lineHeight: 1.6 }}>
            &ldquo;You&apos;re holding your Wednesday pattern — this is the third week you&apos;ve had a mid-week miss. Let&apos;s look at your schedule and redistribute load to avoid it becoming structural.&rdquo;
          </p>
        </div>
        {/* Gym schedule card */}
        <div style={{ backgroundColor: 'var(--dark-raised)', borderRadius: 'var(--radius-m)', border: '1px solid var(--dark-line)', padding: '20px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', color: 'var(--dark-ink)', marginBottom: '14px' }}>Gym schedule — SmartGym</p>
          {[{ dot: 'trust', title: 'HIIT Class', time: '7:00 AM' }, { dot: 'gray', title: 'Spin Class', time: '6:00 PM' }].map((cls, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i === 0 ? '1px solid var(--dark-line)' : 'none' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cls.dot === 'trust' ? 'var(--trust)' : '#5C5449', flexShrink: 0 }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--dark-ink)', flex: 1 }}>{cls.title}</p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A79E8F' }}>{cls.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPreview() {
  return (
    <section style={{ backgroundColor: 'var(--bg)', padding: '80px 0' }}>
      <div className="wrap">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ink-soft)', marginBottom: '32px' }}>
          — THE DASHBOARD
        </p>
        <div style={{ backgroundColor: 'var(--dark-bg)', borderRadius: 'var(--radius-l)', overflow: 'hidden', border: '1px solid var(--dark-line)', display: 'flex', height: '680px' }}>
          <Sidebar />
          <MainContent />
        </div>
      </div>
    </section>
  )
}
