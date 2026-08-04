import React from 'react'

const plans = [
  {
    name: 'Preview',
    price: 'KES 0',
    period: '',
    description: 'Try before you commit. See your first adaptive plan, no payment required.',
    features: ['7-day adaptive plan', 'Calorie estimates', 'Basic logging', 'No gym integration'],
    featured: false,
  },
  {
    name: 'Adaptive plan',
    price: 'KES 1,200',
    period: '/month',
    description: 'Everything rebuilding requires — full adaptivity, health context, and gym sync.',
    features: ['Continuous plan adaptation', 'NCD-aware nutrition', 'Gym schedule sync', 'Coach messaging', 'Confidence indicators on all data', 'Priority support'],
    featured: true,
  },
  {
    name: 'One-time plan',
    price: 'KES 450',
    period: '',
    description: 'A single adaptive week. Good for testing the full system before subscribing.',
    features: ['One week, fully adaptive', 'NCD-aware nutrition', 'Confidence indicators', 'No recurring charge'],
    featured: false,
  },
]

export default function PricingSection() {
  return (
    <section style={{ backgroundColor: 'var(--bg)', padding: '80px 0' }}>
      <div className="wrap">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ink-soft)', marginBottom: '16px' }}>
          — ONE PRICE. NOTHING HIDDEN LATER.
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '42px', letterSpacing: '-.01em', color: 'var(--ink)', marginBottom: '12px' }}>
          Simple pricing, shown in full
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: '480px', marginBottom: '48px' }}>
          Start free for 7 days. If you like it, pay once or subscribe — both are shown right here, no call required.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                position: 'relative',
                backgroundColor: 'var(--bg-raised)',
                border: plan.featured ? '1.5px solid var(--accent)' : '1px solid var(--line)',
                borderRadius: 'var(--radius-l)',
                padding: plan.featured ? '32px 28px 28px' : '28px',
                boxShadow: plan.featured ? '0 8px 32px rgba(184,84,46,.12)' : '0 2px 8px rgba(36,31,26,.04)',
                marginTop: plan.featured ? '0' : '0',
              }}
            >
              {plan.featured && (
                <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em', padding: '5px 14px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                  MOST ADAPTIVE
                </span>
              )}
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-soft)', marginBottom: '12px' }}>{plan.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '40px', color: 'var(--ink)', letterSpacing: '-.02em' }}>{plan.price}</span>
                {plan.period && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-soft)' }}>{plan.period}</span>}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: '24px' }}>{plan.description}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: '10px', fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'var(--ink)' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#" style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', backgroundColor: plan.featured ? 'var(--accent)' : 'transparent', color: plan.featured ? 'var(--accent-ink)' : 'var(--ink)', padding: '12px', borderRadius: '999px', border: plan.featured ? 'none' : '1px solid var(--line)', textDecoration: 'none', transition: 'background-color .15s' }}>
                {plan.featured ? 'Get your plan' : 'Start free'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
