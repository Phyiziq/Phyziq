'use client'

import { useState } from 'react'

// ─── Shared helpers ─────────────────────────────────────────────────────────

/** Eyebrow label: IBM Plex Mono, 11px, uppercase, ls 0.12em, --ink-soft */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 400,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--ink-soft)',
        marginBottom: 16,
      }}
    >
      {children}
    </p>
  )
}

/** Confidence chip — trust (high) or accent (low) variant */
function Chip({
  label,
  variant = 'trust',
}: {
  label: string
  variant?: 'trust' | 'accent'
}) {
  const bg = variant === 'trust' ? 'var(--trust-soft)' : 'var(--accent-soft)'
  const color = variant === 'trust' ? 'var(--trust)' : 'var(--accent)'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: bg,
        color,
        borderRadius: 999,
        padding: '4px 10px 4px 8px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 400,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  )
}

/** Primary pill button */
function BtnPrimary({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      style={{
        background: 'var(--accent)',
        color: 'var(--accent-ink)',
        border: 'none',
        borderRadius: 999,
        padding: '11px 22px',
        fontFamily: 'var(--font-body)',
        fontSize: 14.5,
        fontWeight: 600,
        transition: 'background 0.15s',
        cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'
      }}
    >
      {children}
    </button>
  )
}

/** Ghost button */
function BtnGhost({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <button
      style={{
        background: 'transparent',
        color: 'var(--ink)',
        border: '1px solid var(--line)',
        borderRadius: 999,
        padding: '11px 22px',
        fontFamily: 'var(--font-body)',
        fontSize: 14.5,
        fontWeight: 500,
        transition: 'border-color 0.15s',
        cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--ink)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)'
      }}
    >
      {children}
    </button>
  )
}

// ─── SECTION A: Navbar ───────────────────────────────────────────────────────

function Navbar() {
  const [open, setOpen] = useState(false)
  const navLinks = ['How it works', 'For gyms', 'Marketplace', 'Pricing']

  return (
    <nav
      style={{
        background: 'var(--bg-raised)',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 32px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M2 12 Q5 4 9 9 Q13 14 16 6"
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}
          >
            PHYZIQ
          </span>
        </div>

        {/* Desktop nav links */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 28 }}
          className="hide-mobile"
        >
          {navLinks.map((l) => (
            <a
              key={l}
              href="#"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--ink-soft)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink-soft)'
              }}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          className="hide-mobile"
        >
          <a
            href="#"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--ink)',
              textDecoration: 'none',
            }}
          >
            Log in
          </a>
          <BtnPrimary style={{ padding: '8px 18px', fontSize: 14 }}>
            Get your plan
          </BtnPrimary>
        </div>

        {/* Hamburger */}
        <button
          className="show-mobile"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          style={{
            background: 'none',
            border: 'none',
            padding: 6,
            color: 'var(--ink)',
            display: 'none',
          }}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <line x1="4" y1="4" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="4" x2="4" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <line x1="3" y1="6" x2="19" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          style={{
            background: 'var(--bg-raised)',
            borderTop: '1px solid var(--line)',
            padding: '16px 32px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {navLinks.map((l) => (
            <a
              key={l}
              href="#"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--ink)',
                textDecoration: 'none',
              }}
            >
              {l}
            </a>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <a
              href="#"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--ink-soft)',
                textDecoration: 'none',
              }}
            >
              Log in
            </a>
            <BtnPrimary style={{ padding: '8px 18px', fontSize: 13 }}>
              Get your plan
            </BtnPrimary>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}

// ─── SECTION B: Hero ────────────────────────────────────────────────────────

/** The signature adaptive path SVG */
function AdaptivePathSVG() {
  return (
    <svg
      viewBox="0 0 400 160"
      width="100%"
      height="160"
      aria-label="Adaptive plan path visualisation"
      style={{ display: 'block' }}
    >
      {/* Dashed original plan */}
      <path
        d="M 20,120 Q 100,40 200,80 Q 280,110 380,60"
        stroke="#C8C0B0"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
      />
      {/* Solid rerouted accent path */}
      <path
        d="M 20,120 Q 100,40 180,100 Q 220,115 260,90 Q 320,60 380,50"
        stroke="#B8542E"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Missed dot — dark */}
      <circle cx="180" cy="100" r="5" fill="#241F1A" />
      {/* Confirmed dot — teal */}
      <circle cx="260" cy="90" r="5" fill="#2E6B5E" />
      {/* Start dot */}
      <circle cx="20" cy="120" r="4" fill="#B8542E" />
      {/* End dot */}
      <circle cx="380" cy="50" r="4" fill="#B8542E" />

      {/* Labels */}
      <text
        x="14"
        y="138"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="10"
        fill="#5C5449"
      >
        Mon
      </text>
      <text
        x="148"
        y="118"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="10"
        fill="#5C5449"
      >
        Missed — Wed
      </text>
      <text
        x="238"
        y="82"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="10"
        fill="#2E6B5E"
      >
        Rebuilt · Thu
      </text>
      {/* Dashed label */}
      <text
        x="290"
        y="42"
        fontFamily="IBM Plex Mono, monospace"
        fontSize="9"
        fill="#A09890"
      >
        original plan
      </text>
    </svg>
  )
}

function Hero() {
  return (
    <section
      style={{
        background: 'var(--bg)',
        padding: '80px 0 80px',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 32px',
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 56,
          alignItems: 'center',
        }}
        className="hero-grid"
      >
        {/* Left column */}
        <div>
          <Eyebrow>— Built for how you actually live</Eyebrow>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 56,
              fontWeight: 600,
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
              lineHeight: 1.12,
              margin: '0 0 20px',
            }}
            className="hero-h1"
          >
            A fitness plan that{' '}
            <span style={{ color: 'var(--accent)' }}>adjusts</span> when your
            week doesn&apos;t cooperate.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: 'var(--ink-soft)',
              marginBottom: 32,
              maxWidth: 480,
              lineHeight: 1.65,
            }}
          >
            PHYZIQ generates your workout and nutrition plan, then rebuilds it
            around missed sessions,{' '}
            <span style={{ color: 'var(--accent)' }}>night shifts</span>, and
            real life — not the other way around.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <BtnPrimary>Get your plan</BtnPrimary>
            <BtnGhost>See how it works</BtnGhost>
          </div>
        </div>

        {/* Right column — demo card */}
        <div
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-l)',
            padding: 28,
          }}
        >
          {/* Card header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              This week&apos;s plan
            </span>
            <Chip label="Adapting live" variant="trust" />
          </div>

          {/* The adaptive path SVG */}
          <AdaptivePathSVG />

          {/* Explanation text */}
          <div style={{ marginTop: 16 }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--ink)',
                margin: '0 0 6px',
                fontWeight: 600,
              }}
            >
              You missed Wednesday&apos;s session.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--ink-soft)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Thursday&apos;s plan shifted from a heavy lower-body day to a{' '}
              <span style={{ color: 'var(--accent)' }}>shorter</span>,{' '}
              <span style={{ color: 'var(--accent)' }}>lower-fatigue</span>{' '}
              session — volume preserved.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .hero-h1 { font-size: 38px !important; }
        }
      `}</style>
    </section>
  )
}

// ─── SECTION C: Differentiator cards ────────────────────────────────────────

const differCards = [
  {
    eyebrow: '01 · Adaptive, not static',
    h3: 'Plans that respond to your data',
    body: (
      <>
        Miss a session, sleep badly, or{' '}
        <span style={{ color: 'var(--accent)' }}>hit a plateau</span> —{' '}
        <span style={{ color: 'var(--accent)' }}>your</span> plan changes with{' '}
        <span style={{ color: 'var(--accent)' }}>you</span>, instead of asking
        you to keep up with{' '}
        <span style={{ color: 'var(--accent)' }}>it</span>.
      </>
    ),
  },
  {
    eyebrow: '02 · Aware, not generic',
    h3: 'Nutrition that knows your risk factors',
    body: (
      <>
        Family history of diabetes or hypertension shapes real substitutions —
        safe, practical, never diagnostic.
      </>
    ),
  },
  {
    eyebrow: '03 · Honest, not hidden',
    h3: 'One price, shown up front',
    body: (
      <>
        No add-on fees for nutrition, no surprise jump at client 20. What you
        see is what you pay — for you and for your coach.
      </>
    ),
  },
]

function DifferentiatorCards() {
  return (
    <section style={{ background: 'var(--bg)', padding: '80px 0' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
        <Eyebrow>— Why this, not another AI app</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
            margin: '0 0 10px',
          }}
        >
          Most fitness apps guess once. This one keeps adjusting.
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--ink-soft)',
            marginBottom: 48,
          }}
        >
          Three things that make the difference between a plan you follow and one
          you forget.
        </p>

        {/* Card grid — hairline dividers between cards */}
        <div
          className="differ-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 0,
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-m)',
            overflow: 'hidden',
          }}
        >
          {differCards.map((card, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-raised)',
                padding: '28px 28px 32px',
                borderRight: i < 2 ? '1px solid var(--line)' : 'none',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--ink-soft)',
                  marginBottom: 14,
                }}
              >
                {card.eyebrow}
              </p>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 19,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  letterSpacing: '-0.01em',
                  margin: '0 0 12px',
                }}
              >
                {card.h3}
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--ink-soft)',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .differ-grid { grid-template-columns: 1fr !important; }
          .differ-grid > div { border-right: none !important; border-bottom: 1px solid var(--line); }
          .differ-grid > div:last-child { border-bottom: none; }
        }
      `}</style>
    </section>
  )
}

// ─── SECTION D: For gym owners (dark card) ──────────────────────────────────

function ForGyms() {
  return (
    <section style={{ background: 'var(--bg)', padding: '0 0 80px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
        <div
          className="gyms-grid"
          style={{
            background: 'var(--ink)',
            borderRadius: 'var(--radius-l)',
            padding: '48px 52px',
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 48,
            alignItems: 'center',
          }}
        >
          {/* Left */}
          <div>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#A79E8F',
                marginBottom: 16,
              }}
            >
              — For gym owners
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 600,
                color: '#F2EFE7',
                letterSpacing: '-0.01em',
                margin: '0 0 16px',
                lineHeight: 1.25,
              }}
            >
              You already have the members. We help you keep them.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13.5,
                color: '#A79E8F',
                lineHeight: 1.65,
                marginBottom: 28,
              }}
            >
              Most gyms have{' '}
              <span style={{ color: 'var(--accent)' }}>no idea</span> who&apos;s
              about to stop showing up until they&apos;re gone. PHYZIQ gives you
              that visibility — plus a tool your members{' '}
              <span style={{ color: 'var(--accent)' }}>actually use</span> — at{' '}
              <span style={{ color: 'var(--accent)' }}>no upfront cost</span> to
              you.
            </p>
            <BtnPrimary>See the gym dashboard</BtnPrimary>
          </div>

          {/* Right — stats */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 42,
                  fontWeight: 600,
                  color: '#F2EFE7',
                  margin: '0 0 6px',
                  letterSpacing: '-0.01em',
                }}
              >
                8.5/10
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#A79E8F',
                  margin: 0,
                }}
              >
                Reporting gap in most gym software
              </p>
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 42,
                  fontWeight: 600,
                  color: '#F2EFE7',
                  margin: '0 0 6px',
                  letterSpacing: '-0.01em',
                }}
              >
                0%
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#A79E8F',
                  margin: 0,
                }}
              >
                Upfront cost to partner gyms
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .gyms-grid { grid-template-columns: 1fr !important; padding: 36px 28px !important; }
        }
      `}</style>
    </section>
  )
}

// ─── SECTION E: Dashboard preview (dark mode) ───────────────────────────────

/** Donut chart SVG — 4/5 sessions */
function DonutChart() {
  // r=32, circumference = 2π×32 ≈ 201.06
  // 4/5 = 80% → filled arc = 201.06 × 0.8 ≈ 160.85, gap = 40.21
  const r = 32
  const cx = 40
  const cy = 40
  const circ = 2 * Math.PI * r
  const filled = circ * 0.8
  const gap = circ - filled
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" aria-label="4 of 5 sessions completed">
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#3A322A"
        strokeWidth="6"
      />
      {/* Progress arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#B8542E"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    </svg>
  )
}

function DashboardPreview() {
  return (
    <section
      style={{
        background: '#1C1815',
        padding: '60px 0',
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 32px',
        }}
      >
        {/* Section eyebrow */}
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#A79E8F',
            marginBottom: 8,
          }}
        >
          — Dashboard preview
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 600,
            color: '#F2EFE7',
            letterSpacing: '-0.01em',
            marginBottom: 24,
          }}
        >
          Your plan, always in view
        </h2>

        {/* Dashboard shell */}
        <div
          className="dash-shell"
          style={{
            display: 'flex',
            border: '1px solid #3A322A',
            borderRadius: 'var(--radius-l)',
            overflow: 'hidden',
            minHeight: 520,
          }}
        >
          {/* Sidebar */}
          <aside
            className="dash-sidebar"
            style={{
              width: 240,
              background: '#191512',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 0',
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 20px 20px',
                borderBottom: '1px solid #3A322A',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path
                  d="M2 12 Q5 4 9 9 Q13 14 16 6"
                  stroke="#B8542E"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#F2EFE7',
                }}
              >
                PHYZIQ
              </span>
            </div>

            {/* Nav */}
            <nav style={{ padding: '12px 0', flex: 1 }}>
              {[
                { label: 'Today', active: true },
                { label: 'Plans' },
                { label: 'Coach' },
                { label: 'Marketplace' },
                { label: 'Progress' },
                { label: 'Account' },
              ].map((item) => (
                <a
                  key={item.label}
                  href="#"
                  style={{
                    display: 'block',
                    padding: '9px 20px',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                    background: item.active ? '#2A231C' : 'transparent',
                    color: item.active ? '#F2EFE7' : '#A79E8F',
                    borderLeft: item.active ? '2px solid #B8542E' : '2px solid transparent',
                    transition: 'color 0.15s, background 0.15s',
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Gym info card */}
            <div
              style={{
                margin: '0 12px',
                background: '#241E17',
                borderRadius: 'var(--radius-m)',
                padding: '12px 14px',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#F2EFE7',
                  margin: '0 0 4px',
                }}
              >
                SmartGym — Kilimani
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: '#A79E8F',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Member since Jun 2026 · plan linked to your gym schedule
              </p>
            </div>
          </aside>

          {/* Main content */}
          <div style={{ flex: 1, background: '#1C1815', padding: '24px 28px', minWidth: 0 }}>
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 26,
                    fontWeight: 600,
                    color: '#F2EFE7',
                    margin: '0 0 4px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Good morning, Amina
                </h1>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: '#A79E8F',
                    margin: 0,
                  }}
                >
                  Thursday — your plan shifted after Wednesday&apos;s missed session
                </p>
              </div>
              {/* Avatar */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 600,
                    color: 'var(--accent-ink)',
                  }}
                >
                  A
                </span>
              </div>
            </div>

            {/* Adaptive banner */}
            <div
              style={{
                background: 'linear-gradient(to right, rgba(184,84,46,.14), transparent)',
                border: '1px solid rgba(184,84,46,.3)',
                borderRadius: 'var(--radius-s)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <Chip label="Adjusted" variant="trust" />
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: '#A79E8F',
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                Today&apos;s session is shorter than planned. Lower-body volume moved
                to Saturday so you&apos;re not stacking fatigue two days running.
              </p>
            </div>

            {/* Two-col card area */}
            <div
              className="dash-cards"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1fr',
                gap: 16,
              }}
            >
              {/* LEFT: Today's plan + Recent logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Today's plan card */}
                <div
                  style={{
                    background: '#262019',
                    border: '1px solid #3A322A',
                    borderRadius: 'var(--radius-m)',
                    padding: '20px 20px 4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 17,
                        fontWeight: 600,
                        color: '#F2EFE7',
                      }}
                    >
                      Today&apos;s plan
                    </span>
                    <Chip label="High confidence" variant="trust" />
                  </div>

                  {[
                    {
                      dotFill: '#2E6B5E',
                      title: 'Upper body — moderate',
                      sub: '4 exercises · 32 min',
                      time: '7:10 AM',
                      chip: null,
                      empty: false,
                    },
                    {
                      dotFill: null,
                      title: 'Lunch — grilled tilapia, sukuma wiki, ugali',
                      sub: '612 kcal · balanced for your BP-aware plan',
                      time: null,
                      chip: { label: 'Estimated', variant: 'accent' as const },
                      empty: true,
                    },
                    {
                      dotFill: null,
                      title: 'Evening walk — 20 min',
                      sub: 'Recovery day, low intensity',
                      time: '6:30 PM',
                      chip: null,
                      empty: true,
                    },
                  ].map((item, idx, arr) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 0',
                        borderBottom: idx < arr.length - 1 ? '1px solid #3A322A' : 'none',
                      }}
                    >
                      {/* Dot */}
                      {item.empty ? (
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            border: '1.5px solid #3A322A',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: item.dotFill ?? 'transparent',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#F2EFE7',
                            margin: '0 0 2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: '#A79E8F',
                            margin: 0,
                          }}
                        >
                          {item.sub}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {item.chip && <Chip label={item.chip.label} variant={item.chip.variant} />}
                        {item.time && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: '#A79E8F',
                            }}
                          >
                            {item.time}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent logs card */}
                <div
                  style={{
                    background: '#262019',
                    border: '1px solid #3A322A',
                    borderRadius: 'var(--radius-m)',
                    padding: '20px 20px 4px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 17,
                        fontWeight: 600,
                        color: '#F2EFE7',
                      }}
                    >
                      Recent logs
                    </span>
                    <a
                      href="#"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        color: 'var(--accent)',
                        textDecoration: 'none',
                      }}
                    >
                      See all
                    </a>
                  </div>

                  {[
                    {
                      title: 'Breakfast — mandazi & tea',
                      sub: 'Photo-logged · tap to confirm estimate',
                      chip: { label: 'Estimated', variant: 'accent' as const },
                    },
                    {
                      title: 'Upper body — moderate',
                      sub: 'Logged manually · all sets completed',
                      chip: { label: 'Confirmed', variant: 'trust' as const },
                    },
                  ].map((item, idx, arr) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 0',
                        borderBottom: idx < arr.length - 1 ? '1px solid #3A322A' : 'none',
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 'var(--radius-s)',
                          background: '#3A322A',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 13.5,
                            fontWeight: 500,
                            color: '#F2EFE7',
                            margin: '0 0 2px',
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10.5,
                            color: '#A79E8F',
                            margin: 0,
                          }}
                        >
                          {item.sub}
                        </p>
                      </div>
                      <Chip label={item.chip.label} variant={item.chip.variant} />
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: This week + Coach message + Gym schedule */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* This week card */}
                <div
                  style={{
                    background: '#262019',
                    border: '1px solid #3A322A',
                    borderRadius: 'var(--radius-m)',
                    padding: '20px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 17,
                      fontWeight: 600,
                      color: '#F2EFE7',
                      margin: '0 0 16px',
                    }}
                  >
                    This week
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <DonutChart />
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 24,
                            fontWeight: 600,
                            color: '#F2EFE7',
                            margin: '0 0 2px',
                          }}
                        >
                          4/5
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: '#A79E8F',
                            margin: 0,
                          }}
                        >
                          Sessions
                        </p>
                      </div>
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 24,
                            fontWeight: 600,
                            color: '#F2EFE7',
                            margin: '0 0 2px',
                          }}
                        >
                          2
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: '#A79E8F',
                            margin: 0,
                          }}
                        >
                          Adjusted
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coach message */}
                <div
                  style={{
                    background: '#262019',
                    border: '1px solid #3A322A',
                    borderRadius: 'var(--radius-m)',
                    padding: '20px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--trust)',
                      margin: '0 0 10px',
                    }}
                  >
                    Coach
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 13.5,
                      color: '#A79E8F',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    You&apos;ve hit every adjusted session this week — that&apos;s the
                    pattern that matters more than a perfect streak. Saturday&apos;s
                    plan is set to build on it, not punish Wednesday.
                  </p>
                </div>

                {/* Gym schedule */}
                <div
                  style={{
                    background: '#262019',
                    border: '1px solid #3A322A',
                    borderRadius: 'var(--radius-m)',
                    padding: '20px 20px 4px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#F2EFE7',
                      margin: '0 0 12px',
                    }}
                  >
                    Gym schedule — SmartGym
                  </p>
                  {[
                    { dot: '#2E6B5E', title: 'HIIT — Coach Otieno', time: 'Fri, 6:00 AM' },
                    { dot: null, title: 'Mobility & recovery', time: 'Sat, 9:00 AM' },
                  ].map((item, idx, arr) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 0',
                        borderBottom: idx < arr.length - 1 ? '1px solid #3A322A' : 'none',
                      }}
                    >
                      {item.dot ? (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: item.dot,
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            border: '1.5px solid #3A322A',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 13.5,
                            fontWeight: 500,
                            color: '#F2EFE7',
                            margin: '0 0 2px',
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10.5,
                            color: '#A79E8F',
                            margin: 0,
                          }}
                        >
                          {item.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dash-sidebar { display: none !important; }
          .dash-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ─── SECTION F: Pricing ──────────────────────────────────────────────────────

function Pricing() {
  const checkIcon = (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="7" fill="var(--trust-soft)" />
      <path d="M4 7l2 2 4-4" stroke="var(--trust)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  const plans = [
    {
      name: 'Preview',
      price: 'KES 0',
      per: null,
      desc: 'See your full week\'s structure before paying anything.',
      features: ['Full week preview, workout + meals', 'No card required'],
      cta: 'Start preview',
      ctaType: 'ghost' as const,
      highlight: false,
      badge: null,
    },
    {
      name: 'Adaptive plan',
      price: 'KES 1,200',
      per: '/month',
      desc: 'Workout + nutrition, continuously adapting.',
      features: [
        'Plan adapts weekly to real data',
        'Full nutrition with NCD awareness',
        'PDF + DOCX download',
        'Coach marketplace access',
      ],
      cta: 'Get your plan',
      ctaType: 'primary' as const,
      highlight: true,
      badge: 'Most Adaptive',
    },
    {
      name: 'One-time plan',
      price: 'KES 450',
      per: null,
      desc: 'A single generated plan, no subscription.',
      features: [
        'One workout OR nutrition plan',
        'PDF + DOCX download',
        'No adapting after generation',
      ],
      cta: 'Get one-time plan',
      ctaType: 'ghost' as const,
      highlight: false,
      badge: null,
    },
  ]

  return (
    <section style={{ background: 'var(--bg)', padding: '80px 0' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
        <Eyebrow>— One price. Nothing hidden later.</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
            margin: '0 0 12px',
          }}
        >
          Simple pricing, shown in full
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--ink-soft)',
            maxWidth: 580,
            marginBottom: 48,
            lineHeight: 1.65,
          }}
        >
          Preview any plan for free. Pay only when you want the full, adapting,
          downloadable version — no surprise add-ons for nutrition, no fee that
          jumps once you&apos;re hooked.
        </p>

        <div
          className="pricing-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {plans.map((plan, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-raised)',
                border: plan.highlight ? '1.5px solid var(--accent)' : '1px solid var(--line)',
                borderRadius: 'var(--radius-l)',
                padding: '28px 28px 32px',
                position: 'relative',
                boxShadow: plan.highlight
                  ? '0 4px 28px rgba(184,84,46,.12)'
                  : 'none',
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: -14,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent)',
                    color: 'var(--accent-ink)',
                    borderRadius: 999,
                    padding: '4px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 19,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '0 0 12px',
                }}
              >
                {plan.name}
              </p>

              {/* Price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 40,
                    fontWeight: 400,
                    color: 'var(--ink)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {plan.price}
                </span>
                {plan.per && (
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      color: 'var(--accent)',
                    }}
                  >
                    {plan.per}
                  </span>
                )}
              </div>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13.5,
                  color: 'var(--ink-soft)',
                  marginBottom: 20,
                  lineHeight: 1.55,
                }}
              >
                {plan.desc}
              </p>

              {/* Features */}
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {plan.features.map((f, fi) => (
                  <li
                    key={fi}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: 'var(--font-body)',
                      fontSize: 13.5,
                      color: 'var(--ink)',
                    }}
                  >
                    {checkIcon}
                    {f}
                  </li>
                ))}
              </ul>

              {plan.ctaType === 'primary' ? (
                <BtnPrimary style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                  {plan.cta}
                </BtnPrimary>
              ) : (
                <BtnGhost style={{ width: '100%', justifyContent: 'center', textAlign: 'center' }}>
                  {plan.cta}
                </BtnGhost>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

// ─── SECTION G: Footer ───────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: 'var(--ink)', padding: '52px 0 36px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
        <div
          className="footer-grid"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 32,
            marginBottom: 36,
          }}
        >
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path
                  d="M2 12 Q5 4 9 9 Q13 14 16 6"
                  stroke="#B8542E"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#F2EFE7',
                  letterSpacing: '-0.01em',
                }}
              >
                PHYZIQ
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: '#A79E8F',
                margin: '0 0 6px',
              }}
            >
              Built for how you actually live.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: '#A79E8F',
                margin: 0,
              }}
            >
              🇰🇪 Nairobi, Kenya
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms', 'ODPC Compliance'].map((l) => (
              <a
                key={l}
                href="#"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: '#A79E8F',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#F2EFE7'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#A79E8F'
                }}
              >
                {l}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            borderTop: '1px solid #3A322A',
            paddingTop: 20,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: '#5C5449',
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} PHYZIQ. All rights reserved. Regulated under Kenya Data
            Protection Act 2019.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Root page export ────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <DifferentiatorCards />
        <ForGyms />
        <DashboardPreview />
        <Pricing />
      </main>
      <Footer />
    </>
  )
}
