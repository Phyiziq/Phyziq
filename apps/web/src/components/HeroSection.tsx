import React from 'react'
import Link from 'next/link'
import Chip from './Chip'

function AdaptivePathSVG() {
  return (
    <svg viewBox="0 0 300 100" width="100%" height="80" aria-hidden="true" style={{ overflow: 'visible' }}>
      {/* Dashed original plan path */}
      <path
        d="M 10 50 C 80 50 80 50 150 50 C 220 50 220 50 290 50"
        stroke="#C8C0B0"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        fill="none"
      />
      {/* Solid rerouted path — dips at Wed, rises to Thu */}
      <path
        d="M 10 50 C 60 50 80 50 120 50 C 140 50 145 78 155 78 C 165 78 170 30 200 30 C 230 30 260 30 290 30"
        stroke="var(--accent)"
        strokeWidth="2"
        fill="none"
      />
      {/* Missed marker — Wed */}
      <circle cx="155" cy="78" r="5" fill="var(--ink)" />
      <text x="155" y="96" textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', fill: 'var(--ink-soft)' }}>
        Missed — Wed
      </text>
      {/* Rebuilt marker — Thu */}
      <circle cx="200" cy="30" r="5" fill="var(--trust)" />
      <text x="200" y="22" textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', fill: 'var(--trust)' }}>
        Rebuilt — Thu
      </text>
      {/* Mon label */}
      <text x="10" y="96" textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', fill: 'var(--ink-soft)' }}>
        Mon
      </text>
    </svg>
  )
}

export default function HeroSection() {
  return (
    <section style={{ backgroundColor: 'var(--bg)', padding: '80px 0' }}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: '56px', alignItems: 'center' }}>
        {/* Left column */}
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ink-soft)', marginBottom: '20px' }}>
            — BUILT FOR HOW YOU ACTUALLY LIVE
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '56px', lineHeight: 1.1, letterSpacing: '-.01em', color: 'var(--ink)', marginBottom: '24px' }}>
            A fitness plan that{' '}
            <span style={{ color: 'var(--accent)' }}>adjusts</span>{' '}
            when your week doesn&apos;t cooperate.
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', lineHeight: 1.7, color: 'var(--ink-soft)', marginBottom: '32px', maxWidth: '480px' }}>
            Adaptive generates your workout and nutrition plan, then rebuilds it around missed sessions, night shifts, and real life — not the other way around.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14.5px', backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '13px 26px', borderRadius: '999px', textDecoration: 'none', transition: 'background-color .15s' }}>
              Get your plan
            </Link>
            <Link href="#how-it-works" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14.5px', backgroundColor: 'transparent', color: 'var(--ink)', padding: '13px 26px', borderRadius: '999px', border: '1px solid var(--line)', textDecoration: 'none', transition: 'border-color .15s' }}>
              See how it works
            </Link>
          </div>
        </div>

        {/* Right column — This week's plan card */}
        <div style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--line)', borderRadius: 'var(--radius-l)', padding: '28px', boxShadow: '0 4px 24px rgba(36,31,26,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '19px', color: 'var(--ink)', letterSpacing: '-.01em' }}>
              This week&apos;s plan
            </h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--trust)', letterSpacing: '.04em' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--trust)', display: 'inline-block' }} />
              Adapting live
            </span>
          </div>

          <AdaptivePathSVG />

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14.5px', color: 'var(--ink)', marginBottom: '6px' }}>
              You missed Wednesday&apos;s session.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              Lower-body volume shifted to Thursday. Your week still adds up — just rerouted.
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <Chip variant="estimated" label="Estimated" />
              <Chip variant="trust" label="Rebuilt" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
