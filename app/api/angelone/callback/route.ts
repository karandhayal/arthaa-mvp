// In app/api/angelone/callback/route.ts

// --- MODIFICATION START ---
// Replaced 'createRouteHandlerClient' with the more direct 'createServerClient'
// to bypass the build error.
import { createServerClient, type CookieOptions } from '@supabase/ssr';
// --- MODIFICATION END ---

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authToken = url.searchParams.get('auth_token');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!authToken) {
    return NextResponse.redirect(new URL('/account?error=auth_failed', baseUrl));
  }

  // --- MODIFICATION START: Manually Constructing the Supabase Client ---
  const cookieStore = cookies();

  const supabase = createServerClient(
    // These environment variables are required for the manual setup.
    // Ensure they are correctly set in your Vercel project.
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  // --- MODIFICATION END ---

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/account?error=no_session', baseUrl));
  }

  const { data: config } = await supabase
    .from('broker_config')
    .select('secret_key')
    .eq('user_id', session.user.id)
    .single();

  if (!config || !config.secret_key) {
    return NextResponse.redirect(new URL('/account?error=no_config', baseUrl));
  }

  try {
    const response = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/jwt/v1/generateTokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-PrivateKey': config.secret_key,
      },
      body: JSON.stringify({ "refreshToken": authToken }),
    });

    const tokenData = await response.json();
    if (!tokenData.status || !tokenData.data) {
      throw new Error(tokenData.message || 'Failed to generate tokens.');
    }

    const { jwtToken, refreshToken, feedToken } = tokenData.data;

    const { error } = await supabase
      .from('broker_config')
      .update({
        jwt_token: jwtToken,
        refresh_token: refreshToken,
        feed_token: feedToken,
      })
      .eq('user_id', session.user.id);

    if (error) {
      // Throw the database error to be caught by the catch block
      throw error;
    }

    return NextResponse.redirect(new URL('/live?status=connected', baseUrl));

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error("Error in Angel One callback:", errorMessage);
    return NextResponse.redirect(new URL(`/account?error=${encodeURIComponent(errorMessage)}`, baseUrl));
  }
}
