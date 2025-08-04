// In app/api/angelone/callback/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authToken = url.searchParams.get('auth_token');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!authToken) {
    return NextResponse.redirect(new URL('/account?error=auth_failed', baseUrl));
  }

  const supabase = createRouteHandlerClient({ cookies });
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

    await supabase
      .from('broker_config')
      .update({
        jwt_token: jwtToken,
        refresh_token: refreshToken,
        feed_token: feedToken,
      })
      .eq('user_id', session.user.id);

    return NextResponse.redirect(new URL('/live?status=connected', baseUrl));

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.redirect(new URL(`/account?error=${encodeURIComponent(errorMessage)}`, baseUrl));
  }
}
