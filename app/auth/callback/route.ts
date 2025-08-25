// FILE: app/auth/callback/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * This route handles the OAuth callback from Supabase.
 * When a user successfully logs in via an external provider, Supabase redirects them here.
 * We then exchange the temporary 'code' for a permanent user session.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // If the user was trying to access a specific page before logging in,
  // we can redirect them back to that page ("next") after a successful login.
  // Otherwise, we default to the homepage.
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // Create a Supabase client that can securely handle cookies on the server.
    const supabase = createClient();

    // Exchange the authorization code for a session.
    // This securely stores the user's session in cookies.
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If the exchange is successful, redirect the user to their intended page.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's no code or an error occurs, log the error and
  // redirect the user to an error page so they know something went wrong.
  console.error('Error in auth callback: Could not exchange code for session');
  return NextResponse.redirect(`${origin}/auth/auth-error`);
}
