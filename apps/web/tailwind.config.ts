import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F2EFE7',
        'bg-raised': '#FBF9F4',
        ink: '#241F1A',
        'ink-soft': '#5C5449',
        line: '#E2DCCC',
        accent: '#B8542E',
        'accent-hover': '#9E4523',
        'accent-ink': '#FBF9F4',
        'accent-soft': '#F0D9C9',
        trust: '#2E6B5E',
        'trust-soft': '#DCEAE5',
        // Dark mode tokens
        'dark-bg': '#1C1815',
        'dark-raised': '#262019',
        'dark-ink': '#F2EFE7',
        'dark-ink-soft': '#A79E8F',
        'dark-line': '#3A322A',
        'dark-sidebar': '#191512',
        'dark-sidebar-active': '#2A231C',
        'dark-gym-card': '#241E17',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        s: '6px',
        m: '12px',
        l: '20px',
        pill: '999px',
      },
      maxWidth: {
        wrap: '1180px',
      },
    },
  },
  plugins: [],
}

export default config
