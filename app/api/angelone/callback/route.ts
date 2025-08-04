    // In app/api/angelone/callback/route.ts

    import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
    import { cookies } from 'next/headers';
    import { NextResponse } from 'next/server';

    export async function GET(request: Request) {
      const url = new URL(request.url);
      const authToken = url.searchParams.get('auth_token');

      if (!authToken) {
        return NextResponse.redirect(new URL('/account?error=auth_failed', process.env.NEXT_PUBLIC_BASE_URL));
      }

      const supabase = createRouteHandlerClient({ cookies });
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return NextResponse.redirect(new URL('/account?error=no_session', process.env.NEXT_PUBLIC_BASE_URL));
      }

      // Fetch the user's secret key to generate the final token
      const { data: config } = await supabase
        .from('broker_config')
        .select('secret_key')
        .eq('user_id', session.user.id)
        .single();

      if (!config || !config.secret_key) {
        return NextResponse.redirect(new URL('/account?error=no_config', process.env.NEXT_PUBLIC_BASE_URL));
      }

      try {
        // Exchange the auth_token for a long-lived access token
        const response = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/jwt/v1/generateTokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
            'X-PrivateKey': config.secret_key, // This should be the API Key, not secret
          },
          body: JSON.stringify({
            "refreshToken": authToken // The initial token is used as a refresh token
          }),
        });

        const tokenData = await response.json();
        if (!tokenData.status || !tokenData.data) {
          throw new Error(tokenData.message || 'Failed to generate tokens.');
        }

        const { jwtToken, refreshToken, feedToken } = tokenData.data;

        // Securely save the tokens to the database
        await supabase
          .from('broker_config')
          .update({
            jwt_token: jwtToken,
            refresh_token: refreshToken,
            feed_token: feedToken,
          })
          .eq('user_id', session.user.id);

        // Redirect the user to the live trading page on success
        return NextResponse.redirect(new URL('/live?status=connected', process.env.NEXT_PUBLIC_BASE_URL));

      } catch (error: any) {
        return NextResponse.redirect(new URL(`/account?error=${error.message}`, process.env.NEXT_PUBLIC_BASE_URL));
      }
    }
    