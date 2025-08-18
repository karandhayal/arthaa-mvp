// FILE: app/api/angelone/login/route.ts
import { createClient } from '@/lib/supabase/server'; // IMPORT our helper
import { NextResponse } from 'next/server';
// Note: We no longer need to import 'cookies' from 'next/headers'

export async function GET() {
  // --- FIX: Use the new helper function to create the client ---
  const supabase = createClient();
  // --- END of FIX ---

  // 1. Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // If no user, redirect them to the account page to log in first
    return NextResponse.redirect(new URL('/account', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  }

  // 2. Securely fetch the user's saved Angel One API key
  const { data: config } = await supabase
    .from('broker_config')
    .select('api_key')
    .eq('user_id', session.user.id)
    .single();

  if (!config || !config.api_key) {
    // If they haven't saved their keys, send them back to the account page
    return NextResponse.redirect(new URL('/account?error=no_keys', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  }

  // 3. Construct the official Angel One login URL and redirect the user
  const authUrl = `https://smartapi.angelbroking.com/publisher-login?api_key=${config.api_key}`;
  
  return NextResponse.redirect(authUrl);
}