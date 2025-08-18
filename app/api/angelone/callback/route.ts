// FILE: app/api/angelone/callback/route.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authToken = url.searchParams.get('auth_token');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!authToken) {
    console.error("Angel One callback error: No auth_token in URL.");
    return NextResponse.redirect(new URL('/account?error=auth_failed', baseUrl));
  }

  // Use the self-contained helper to create a Supabase client
  const supabase = createClient();

  // Ensure there is an active user session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error("Angel One callback error: No active Supabase session.");
    return NextResponse.redirect(new URL('/account?error=no_session', baseUrl));
  }

  // Fetch the user's secret key from the database
  const { data: config, error: configError } = await supabase
    .from('broker_config')
    .select('secret_key')
    .eq('user_id', session.user.id)
    .single();

  if (configError || !config?.secret_key) {
    console.error("Angel One callback error: Could not retrieve secret_key for user.", configError);
    return NextResponse.redirect(new URL('/account?error=no_config', baseUrl));
  }

  try {
    // Exchange the Angel One auth token for a long-lived JWT
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
    if (!response.ok || !tokenData.status || !tokenData.data) {
      throw new Error(tokenData.message || 'Failed to generate tokens from Angel One.');
    }

    const { jwtToken, refreshToken, feedToken } = tokenData.data;

    // Update the user's broker configuration with the new tokens
    const { error: updateError } = await supabase
      .from('broker_config')
      .update({
        jwt_token: jwtToken,
        refresh_token: refreshToken,
        feed_token: feedToken,
      })
      .eq('user_id', session.user.id);

    if (updateError) {
      // If the update fails, throw the error to be caught by the catch block
      throw updateError;
    }

    // On success, redirect the user to the live trading page
    return NextResponse.redirect(new URL('/live?status=connected', baseUrl));

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error("Error in Angel One callback process:", errorMessage);
    // Redirect to the account page with a specific error message
    return NextResponse.redirect(new URL(`/account?error=${encodeURIComponent(errorMessage)}`, baseUrl));
  }
}