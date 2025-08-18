// FILE: app/auth/callback/route.ts
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server'; // IMPORT our helper
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  console.error('Error in auth callback:', 'Could not exchange code for session');
  return NextResponse.redirect(`${origin}/auth/auth-error`);
}