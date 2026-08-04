import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PHYZIQ — AI Fitness Platform',
  description: 'Adaptive AI coaching, built for how you actually live.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
