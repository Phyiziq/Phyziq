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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg)', overflow: 'hidden' }}>
      
      {/* Sidebar (Desktop) */}
      <aside className="dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column', width: '260px', backgroundColor: 'var(--bg-raised)', borderRight: '1px solid var(--line)', padding: '24px' }}>
        <div style={{ fontSize: '24px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent)' }}>~</span> Adaptive
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className="nav-link"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: 'var(--radius-s)', textDecoration: 'none',
                  backgroundColor: isActive ? 'var(--trust-soft)' : 'transparent',
                  color: isActive ? 'var(--trust)' : 'var(--ink-soft)',
                  fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: isActive ? 600 : 500
                }}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <button 
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: 'var(--radius-s)', color: 'var(--accent)', fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', marginTop: 'auto', textAlign: 'left' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Mobile Header */}
        <header className="md:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-raised)', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>
            <span style={{ color: 'var(--accent)' }}>~</span> Adaptive
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'var(--ink)' }}>
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden" style={{ backgroundColor: 'var(--bg-raised)', borderBottom: '1px solid var(--line)', padding: '16px' }}>
            {navItems.map(item => (
              <Link key={item.name} href={item.href} style={{ display: 'block', padding: '10px 0', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--ink)', textDecoration: 'none', borderBottom: '1px solid var(--line)' }} onClick={() => setMobileMenuOpen(false)}>
                {item.name}
              </Link>
            ))}
          </div>
        )}

        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
