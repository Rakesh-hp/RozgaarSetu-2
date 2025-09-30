'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/ThemeToggle';

interface NavbarProps {
  activePage: 'home' | 'book-service' | 'my-bookings' | 'dashboard' | 'about' | 'contact';
}

export default function Navbar({ activePage }: NavbarProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted) {
          setUser(user);
          setLoading(false);
        }
      } catch (error) {
        console.error('Navbar auth error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Set timeout to prevent infinite loading in navbar
    setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 3000);

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const getNavLinkClass = (page: string) => {
    return activePage === page
      ? "text-white font-medium border-b-2 border-white/60 pb-1"
      : "text-white/80 hover:text-white transition-colors font-medium hover:scale-105 transform duration-200";
  };

  return (
    <header className="fixed top-0 w-full z-50 glass backdrop-blur-md border-b border-white/10">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/home" className="flex items-center gap-2 cursor-pointer">
                <h1 className="text-2xl font-bold text-white gradient-text">RozgaarSetu</h1>
              </Link>
            </div>

            {/* Navigation Menu - Centered */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center space-x-8">
                <Link
                  href="/home"
                  className={getNavLinkClass('home')}
                >
                  Home
                </Link>
                <Link
                  href="/book-service"
                  className={getNavLinkClass('book-service')}
                >
                  Book Service
                </Link>
                <Link
                  href="/my-bookings"
                  className={getNavLinkClass('my-bookings')}
                >
                  My Bookings
                </Link>
                <Link
                  href="/dashboard"
                  className={getNavLinkClass('dashboard')}
                >
                  Dashboard
                </Link>
                <Link
                  href="/about"
                  className={getNavLinkClass('about')}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className={getNavLinkClass('contact')}
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <LanguageSelector />
              {loading ? (
                <div className="w-20 h-10 glass rounded-full animate-pulse"></div>
              ) : user ? (
                <button
                  onClick={handleLogout}
                  className="btn-gradient text-white px-6 py-2 rounded-full hover:shadow-lg font-medium transition-all duration-300 hover:scale-105 transform"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="btn-gradient text-white px-6 py-2 rounded-full hover:shadow-lg font-medium transition-all duration-300 hover:scale-105 transform"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}