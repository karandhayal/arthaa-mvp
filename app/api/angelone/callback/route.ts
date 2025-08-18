// FILE: app/api/angelone/callback/route.ts
// ACTION: Replace the entire file with this final updated code.

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authToken = url.searchParams.get('auth_token');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!authToken) {
    return NextResponse.redirect(new URL('/account?error=auth_failed', baseUrl));
  }

  // --- FINAL FIX: Initialize Supabase client by calling cookies() inside each method ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Call cookies() directly inside the method
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Call cookies() directly inside the method
          cookies().set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Call cookies() directly inside the method
          cookies().delete({ name, ...options });
        },
      },
    }
  );
  // --- END of FIX ---

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
      throw error;
    }

    return NextResponse.redirect(new URL('/live?status=connected', baseUrl));

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error("Error in Angel One callback:", errorMessage);
    return NextResponse.redirect(new URL(`/account?error=${encodeURIComponent(errorMessage)}`, baseUrl));
  }
}