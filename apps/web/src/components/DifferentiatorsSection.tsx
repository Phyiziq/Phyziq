import React from 'react'

const cards = [
  {
    num: '01',
    title: 'Adaptive, not static',
    subtitle: 'Plans that respond to your data',
    body: (
      <>
        When you{' '}
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>hit a plateau</span>
        {' '}or miss a session,{' '}
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>it</span>
        {' '}rebuilds your week automatically — not just flags that{' '}
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>you</span>
        {' '}fell off track.
      </>
    ),
  },
  {
    num: '02',
    title: 'Aware, not generic',
    subtitle: 'Nutrition that knows your risk factors',
    body: (
      <>
        Meals are planned around your actual health context — low-GI options for pre-diabetics,
        blood-pressure-aware portions — not a{' '}
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>generic</span>
        {' '}calorie target.
      </>
    ),
  },
  {
    num: '03',
    title: 'Honest, not hidden',
    subtitle: 'One price, shown up front',
    body: (
      <>
        <span style={{ color: 'var(--accent)', fontWeight: 500 }}>KES 1,200/month</span>
        {' '}on the pricing page. No upsells mid-session, no hidden tiers, no &ldquo;premium AI&rdquo; gate behind the thing you actually came for.
      </>
    ),
  },
]

export default function DifferentiatorsSection() {
  return (
    <section style={{ backgroundColor: 'var(--bg)', padding: '80px 0' }}>
      <div className="wrap">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ink-soft)', marginBottom: '16px' }}>
          — WHY THIS, NOT ANOTHER AI APP
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '34px', letterSpacing: '-.01em', color: 'var(--ink)', marginBottom: '14px', maxWidth: '560px' }}>
          Most fitness apps guess once. This one keeps adjusting.
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: '520px', marginBottom: '48px' }}>
          The difference isn&apos;t the AI — it&apos;s that ours knows when it&apos;s wrong and corrects course without you having to ask.
        </p>

        {/* 3-column grid with 1px hairline dividers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', backgroundColor: 'var(--line)', border: '1px solid var(--line)', borderRadius: 'var(--radius-m)', overflow: 'hidden' }}>
          {cards.map((card) => (
            <div key={card.num} style={{ backgroundColor: 'var(--bg-raised)', padding: '28px 28px 32px' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--ink-soft)', marginBottom: '16px' }}>
                {card.num} — {card.title}
              </p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '19px', color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: '12px' }}>
                {card.subtitle}
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--ink-soft)', lineHeight: 1.7 }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
