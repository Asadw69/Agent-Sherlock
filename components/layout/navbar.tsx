'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Plus, Menu, X, LayoutDashboard, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-2 sm:top-4 left-0 right-0 z-50 px-3 sm:px-6 lg:px-8 pointer-events-none transition-all duration-300">
      <div className="mx-auto max-w-6xl pointer-events-auto">
        <div
          className={cn(
            'flex h-14 sm:h-16 items-center justify-between rounded-2xl sm:rounded-full border px-4 sm:px-6 transition-all duration-300',
            scrolled || mobileOpen
              ? 'border-[#ff1053]/30 bg-[#080104]/90 shadow-2xl backdrop-blur-xl'
              : 'border-white/10 bg-[#080104]/70 shadow-xl backdrop-blur-lg'
          )}
        >
          {/* Logo / Brand */}
          <Link 
            href="/" 
            className="group flex items-center gap-2.5 shrink-0" 
            onClick={() => setMobileOpen(false)}
          >
            <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#ff1053] to-[#e6004c] p-0.5 overflow-hidden shadow-[0_0_12px_rgba(255,16,83,0.5)] group-hover:scale-105 transition-all duration-200 border border-[#ff1053]/40">
              <Image
                src="/logo.png"
                alt="AgentSherlock Logo"
                width={36}
                height={36}
                className="h-full w-full object-cover rounded-full"
                priority
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-white">
                AgentSherlock
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items (Pill style) */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-black/50 p-1 border border-white/10 backdrop-blur-md">
            <Link
              href="/"
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                pathname === '/'
                  ? 'bg-[#ff1053] text-white shadow-[0_0_12px_rgba(255,16,83,0.5)]'
                  : 'text-white/60 hover:text-white'
              )}
            >
              Home
            </Link>
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href === '/dashboard' &&
                  (pathname?.startsWith('/dashboard') ||
                    pathname?.startsWith('/incidents') ||
                    pathname?.startsWith('/investigations')));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                    isActive
                      ? 'bg-[#ff1053] text-white shadow-[0_0_12px_rgba(255,16,83,0.5)]'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Button */}
          <div className="hidden md:flex items-center">
            <Link
              href="/incidents/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff1053] to-[#e6004c] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#ff1053]/25 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,16,83,0.5)] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.8]" />
              <span>New Incident</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Capsule */}
        {mobileOpen && (
          <div className="md:hidden mt-2 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-elev-3 dark:border-slate-800/90 dark:bg-slate-900/95 backdrop-blur-xl animate-drawer-in">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Home className="h-4 w-4 text-blue-500" />
                Home
              </Link>
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon className="h-4 w-4 text-blue-500" />
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-2">
                <Link
                  href="/incidents/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  New Incident
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

