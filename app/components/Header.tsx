'use client';

import { useState } from 'react';
import type { Session } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { FiMenu, FiX } from 'react-icons/fi'; // Icons for the mobile menu
import Link from 'next/link';

type HeaderProps = {
  session: Session | null;
  onLoginClick: () => void;
};

// The SVG logo component
const Logo = () => (
    <svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
        <defs>
            <linearGradient id="gradDark" x1="50" y1="0" x2="50" y2="100">
                <stop stopColor="#34d399"/>
                <stop offset="1" stopColor="#10b981"/>
            </linearGradient>
        </defs>
        <g transform="translate(0, 5)">
            <path d="M50 0 L0 80 L20 80 L50 40 L80 80 L100 80 L50 0Z" fill="url(#gradDark)"/>
            <path d="M38 80 L50 60 L62 80 H38Z" fill="#0f172a" opacity="0.5"/>
        </g>
        <text x="120" y="65" fontFamily="Inter, sans-serif" fontSize="50" fontWeight="800" fill="#FFFFFF">Arthaa</text>
        <circle cx="345" cy="58" r="8" fill="#34d399"/>
    </svg>
);

export default function Header({ session, onLoginClick }: HeaderProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAvatarClick = () => {
    if (session) {
      router.push('/account');
    } else {
      onLoginClick();
    }
    setIsMobileMenuOpen(false); // Close mobile menu on click
  };

  // A reusable component for the navigation links to avoid repetition
  const navLinks = (
    <>
      <Link href="/builder" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-300 hover:text-emerald-400 transition-colors px-3 py-2 rounded-md text-sm font-medium block">Strategy Builder</Link>
      <Link href="/backtest" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-300 hover:text-emerald-400 transition-colors px-3 py-2 rounded-md text-sm font-medium block">Backtester</Link>
    </>
  );

  return (
    <header className="w-full bg-slate-800 shadow-md relative z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/landing" className="hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation & Account */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">{navLinks}</div>
            <div className="w-px h-6 bg-slate-600"></div> {/* Separator */}
            <button
              onClick={handleAvatarClick}
              className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors"
            >
              <FaUserCircle size={24} />
              <span className="text-sm font-medium">
                {session ? 'Account' : 'Login'}
              </span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks}
            <div className="pt-4 mt-4 border-t border-slate-700">
                 <button
                    onClick={handleAvatarClick}
                    className="w-full flex items-center gap-3 text-white hover:text-emerald-400 transition-colors p-2 rounded-md text-left"
                >
                    <FaUserCircle size={22} />
                    <span className="text-base font-medium">
                        {session ? 'Account' : 'Login / Sign Up'}
                    </span>
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
