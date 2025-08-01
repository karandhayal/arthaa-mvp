'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import type { User } from '@supabase/auth-helpers-nextjs';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        // If no user is found, redirect to the home page.
        router.push('/');
      }
      setLoading(false);
    };
    getUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Redirect to home page after logout.
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8">
      <div className="max-w-md mx-auto bg-slate-800 rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-emerald-400">My Account</h1>
        {user && (
          <div className="space-y-4">
            <p>
              <span className="font-semibold">Email:</span> {user.email}
            </p>
            <p>
              <span className="font-semibold">Last Signed In:</span>{' '}
              {new Date(user.last_sign_in_at || '').toLocaleString()}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="mt-8 w-full py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}