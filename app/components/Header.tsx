// In app/components/Header.tsx

'use client';

import type { Session } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import Link from 'next/link';

type HeaderProps = {
  session: Session | null;
  onLoginClick: () => void;
};

export default function Header({ session, onLoginClick }: HeaderProps) {
  const router = useRouter();

  const handleAvatarClick = () => {
    if (session) {
      router.push('/account');
    } else {
      onLoginClick();
    }
  };

  return (
    <header className="w-full bg-slate-800 p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-6">
        {/* Main logo links to the landing page */}
        <Link href="/landing" className="text-2xl font-bold text-white hover:opacity-80 transition-opacity">
          Arthaa<span className="text-emerald-400">.</span>
        </Link>
        {/* Navigation links for the app */}
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link href="/builder" className="hover:text-emerald-400 transition-colors">Strategy Builder</Link>
          <Link href="/backtest" className="hover:text-emerald-400 transition-colors">Backtester</Link>
        </nav>
      </div>

      <div>
        <button
          onClick={handleAvatarClick}
          className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors"
        >
          <FaUserCircle size={28} />
          <span className="hidden sm:block text-sm">
            {session ? 'Account' : 'Login / Sign Up'}
          </span>
        </button>
      </div>
    </header>
  );
}
