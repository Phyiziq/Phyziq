import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative animate-fade-in">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-muted hover:text-primary transition-colors">
        <ArrowLeft size={20} /> Back to home
      </Link>
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-bold text-primary tracking-widest mb-2">PHYZIQ</h1>
        <p className="text-muted">Premium Adaptive Fitness</p>
      </div>
      
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
