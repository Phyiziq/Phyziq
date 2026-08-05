import Link from 'next/link';
import { Activity, Zap, Shield, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in">
      
      {/* Navbar Mock */}
      <nav className="absolute top-0 w-full max-w-7xl flex items-center justify-between p-6">
        <div className="text-3xl font-display font-bold tracking-wider text-primary">
          PHYZIQ
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="btn-secondary">Log In</Link>
          <Link href="/register" className="btn-primary">Join Now</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-4xl mt-32 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium mb-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
          Next-Generation AI Fitness
        </div>
        
        <h1 className="text-6xl md:text-8xl font-display font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary to-muted mb-8">
          Adapt to your <span className="text-accent">limitless</span> potential.
        </h1>
        
        <p className="text-xl md:text-2xl text-muted mb-12 max-w-2xl">
          The ultimate platform bridging AI-driven adaptive plans, elite coaching, and premium B2B gym integration.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/register" className="btn-primary text-lg px-8 py-4">
            Start Your Journey <ChevronRight size={20} />
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 mb-32 max-w-7xl w-full px-4">
        <div className="glass-panel p-8 flex flex-col items-start hover:-translate-y-2 transition-transform duration-300">
          <div className="p-3 bg-accent/20 rounded-xl mb-6">
            <Activity className="text-accent" size={32} />
          </div>
          <h3 className="text-2xl font-display font-bold mb-4">Adaptive Engine</h3>
          <p className="text-muted">Plans that evolve dynamically in real-time based on your logged sessions and mood scores.</p>
        </div>

        <div className="glass-panel p-8 flex flex-col items-start hover:-translate-y-2 transition-transform duration-300">
          <div className="p-3 bg-accent/20 rounded-xl mb-6">
            <Zap className="text-accent" size={32} />
          </div>
          <h3 className="text-2xl font-display font-bold mb-4">Coach Marketplace</h3>
          <p className="text-muted">Book 1-on-1 digital sessions with elite human coaches to refine your technique and strategy.</p>
        </div>

        <div className="glass-panel p-8 flex flex-col items-start hover:-translate-y-2 transition-transform duration-300">
          <div className="p-3 bg-accent/20 rounded-xl mb-6">
            <Shield className="text-accent" size={32} />
          </div>
          <h3 className="text-2xl font-display font-bold mb-4">Gym Hub</h3>
          <p className="text-muted">Seamless gym integration via QR drops, allowing deep physical tracking and cohort leaderboards.</p>
        </div>
      </div>

    </div>
  );
}
