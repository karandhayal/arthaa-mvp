// In app/api/angelone/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// Note: You would typically use an SDK, but for this example, we'll use fetch.

export async function POST(request: Request) {
  const { symbol, qty, side, exchange, productType } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Get the current user
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Securely fetch the user's Angel One keys
  const { data: config } = await supabase
    .from('broker_config')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (!config) {
    return NextResponse.json({ error: 'Angel One configuration not found.' }, { status: 400 });
  }

  try {
    // --- Angel One Authentication Flow ---
    // This is a simplified representation. The actual flow involves generating a session token.
    // For this MVP, we'll assume we have a valid token. In a real app, you'd implement the full
    // login flow to get a fresh `jwtToken`.
    const jwtToken = "A_VALID_JWT_TOKEN"; // This would be dynamically generated and stored.

    // --- Place the Order ---
    const orderPayload = {
        "variety": "NORMAL",
        "tradingsymbol": symbol, // e.g., "SBIN-EQ"
        "symboltoken": "3045", // This needs to be fetched from Angel One's instrument list
        "transactiontype": side.toUpperCase(), // "BUY" or "SELL"
        "exchange": exchange, // "NSE" or "BSE"
        "ordertype": "MARKET",
        "producttype": productType, // "DELIVERY", "INTRADAY", "MARGIN"
        "duration": "DAY",
        "quantity": qty.toString()
    };

    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/placeOrder', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-PrivateKey': config.api_key,
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
        },
        body: JSON.stringify(orderPayload)
    });

    const result = await response.json();
    if (!result.status) {
        throw new Error(result.message || 'Failed to place order.');
    }

    return NextResponse.json(result.data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
