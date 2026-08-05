import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PHYZIQ — A fitness plan that adjusts',
  description:
    'Adaptive generates your workout and nutrition plan, then rebuilds it around missed sessions, night shifts, and real life.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,450;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
