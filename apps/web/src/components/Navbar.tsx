'use client'

import React, { useState } from 'react'

const navLinks = ['How it works', 'For gyms', 'Marketplace', 'Pricing']

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: 'var(--bg-raised)', borderColor: 'var(--line)' }}>
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{ fontSize: '20px', color: 'var(--accent)' }}>~</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: 'var(--ink)', letterSpacing: '-.01em' }}>
            Adaptive
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex" style={{ gap: '32px', alignItems: 'center' }}>
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="nav-link"
              style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--ink-soft)', textDecoration: 'none' }}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex" style={{ gap: '12px', alignItems: 'center' }}>
          <a href="#" className="ghost-btn" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: 'var(--ink)', textDecoration: 'none', padding: '8px 16px', border: '1px solid var(--line)', borderRadius: '999px' }}>
            Log in
          </a>
          <a href="#" className="primary-btn" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--accent-ink)', backgroundColor: 'var(--accent)', padding: '8px 20px', borderRadius: '999px', textDecoration: 'none' }}>
            Get your plan
          </a>
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--ink)', fontSize: '18px' }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ backgroundColor: 'var(--bg-raised)', borderTop: '1px solid var(--line)', padding: '16px 24px 20px' }}>
          {navLinks.map((link) => (
            <a key={link} href="#" style={{ display: 'block', padding: '10px 0', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--ink)', textDecoration: 'none', borderBottom: '1px solid var(--line)' }}>
              {link}
            </a>
          ))}
          <a href="#" style={{ display: 'block', marginTop: '16px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--accent-ink)', backgroundColor: 'var(--accent)', padding: '10px', borderRadius: '999px', textDecoration: 'none' }}>
            Get your plan
          </a>
        </div>
      )}
    </nav>
  )
}
