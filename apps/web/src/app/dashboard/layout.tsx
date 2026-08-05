"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Dumbbell, Calendar, Settings, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('phyziq_token');
    router.push('/');
  };

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'My Plan', href: '/dashboard/plan', icon: Dumbbell },
    { name: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden animate-fade-in">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-panel border-r border-border p-6">
        <div className="text-2xl font-display font-bold tracking-widest text-primary mb-12">PHYZIQ</div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-accent/10 text-accent font-medium' : 'text-muted hover:text-primary hover:bg-panelHover'
                }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors mt-auto"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-panel border-b border-border">
          <div className="text-xl font-display font-bold text-primary">PHYZIQ</div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-primary p-2">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Dropdown (Mocked for brevity) */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-panel border-b border-border p-4 space-y-2">
            {navItems.map(item => (
              <Link key={item.name} href={item.href} className="block px-4 py-2 text-primary" onClick={() => setMobileMenuOpen(false)}>
                {item.name}
              </Link>
            ))}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
