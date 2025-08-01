'use client';

import type { Session } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';

type HeaderProps = {
  session: Session | null;
  onLoginClick: () => void;
};

export default function Header({ session, onLoginClick }: HeaderProps) {
  const router = useRouter();

  const handleAvatarClick = () => {
    // If user is logged in, go to the account page.
    if (session) {
      router.push('/account');
    } else {
      // If user is logged out, open the login modal.
      onLoginClick();
    }
  };

  return (
    <header className="w-full bg-slate-800 p-4 flex justify-between items-center shadow-md">
      {/* Logo */}
      <a href="/" className="text-2xl font-bold text-white hover:opacity-80 transition-opacity">
        Strategy<span className="text-emerald-400">Builder</span>
      </a>

      {/* Login/User Avatar */}
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
      <div className="flex items-center gap-6">
    <a href="/backtest" className="text-sm text-white hover:text-emerald-400 transition-colors">
        Backtester
    </a>
    {/* The existing logo div */}
    <a href="/" className="text-2xl font-bold text-white hover:opacity-80 transition-opacity">
        Strategy<span className="text-emerald-400">Builder</span>
    </a>
</div>
    </header>
  );
}