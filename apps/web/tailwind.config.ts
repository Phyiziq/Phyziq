import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F2EFE7',
        bgRaised: '#FBF9F4',
        ink: '#241F1A',
        inkSoft: '#5C5449',
        line: '#E2DCCC',
        accent: '#B8542E',
        accentInk: '#FBF9F4',
        accentSoft: '#F0D9C9',
        trust: '#2E6B5E',
        trustSoft: '#DCEAE5',
        darkBg: '#1C1815',
        darkRaised: '#262019',
        darkInk: '#F2EFE7',
        darkLine: '#3A322A',
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
    },
  },
  plugins: [],
}

export default config
