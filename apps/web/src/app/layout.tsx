import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PHYZIQ | Premium Adaptive Fitness',
  description: 'AI-driven fitness and nutrition plans that adapt to your life in real-time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col relative overflow-x-hidden">
        {/* Background ambient glow effect */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
        
        {/* Main Content */}
        <main className="flex-grow z-10">
          {children}
        </main>
      </body>
    </html>
  )
}
