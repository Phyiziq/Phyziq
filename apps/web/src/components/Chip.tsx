import React from 'react'

interface ChipProps {
  variant: 'trust' | 'estimated'
  label: string
}

/**
 * Trust/confidence chip.
 * - trust: teal, high confidence / confirmed
 * - estimated: sienna, estimated / low confidence
 */
export default function Chip({ variant, label }: ChipProps) {
  const isTrust = variant === 'trust'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px 4px 8px',
        borderRadius: '999px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 400,
        backgroundColor: isTrust ? 'var(--trust-soft)' : 'var(--accent-soft)',
        color: isTrust ? 'var(--trust)' : 'var(--accent)',
        letterSpacing: '.04em',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          flexShrink: 0,
          backgroundColor: isTrust ? 'var(--trust)' : 'var(--accent)',
        }}
      />
      {label}
    </span>
  )
}
