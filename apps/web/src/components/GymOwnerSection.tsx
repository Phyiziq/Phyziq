import React from 'react'

export default function GymOwnerSection() {
  return (
    <section style={{ backgroundColor: 'var(--bg)', padding: '80px 0' }}>
      <div className="wrap">
        <div style={{ backgroundColor: 'var(--dark-bg)', borderRadius: 'var(--radius-l)', padding: '56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>
          {/* Left */}
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: '#A79E8F', marginBottom: '20px' }}>
              — FOR GYM OWNERS
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '34px', letterSpacing: '-.01em', color: 'var(--dark-ink)', lineHeight: 1.2, marginBottom: '20px' }}>
              You already have the members. We help you keep them.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#A79E8F', lineHeight: 1.7, marginBottom: '32px' }}>
              Most gyms have no idea who&apos;s about to stop showing up until they&apos;re gone. Adaptive gives you that visibility — plus a tool your members actually use — at no upfront cost to you.
            </p>
            <a
              href="#"
              style={{ display: 'inline-block', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14.5px', backgroundColor: 'var(--accent)', color: 'var(--accent-ink)', padding: '13px 26px', borderRadius: '999px', textDecoration: 'none', transition: 'background-color .15s' }}
            >
              See the gym dashboard
            </a>
          </div>

          {/* Right — stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '56px', color: 'var(--dark-ink)', letterSpacing: '-.02em', lineHeight: 1, marginBottom: '8px' }}>
                8.5/10
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: '#A79E8F' }}>
                REPORTING GAP IN MOST GYM SOFTWARE
              </p>
            </div>
            <div style={{ borderTop: '1px solid var(--dark-line)', paddingTop: '36px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '56px', color: 'var(--dark-ink)', letterSpacing: '-.02em', lineHeight: 1, marginBottom: '8px' }}>
                0%
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: '#A79E8F' }}>
                UPFRONT COST TO PARTNER GYMS
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
