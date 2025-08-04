// In app/api/angelone/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { symbol, qty, side, exchange, productType } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: config } = await supabase
    .from('broker_config')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (!config) {
    return NextResponse.json({ error: 'Angel One configuration not found.' }, { status: 400 });
  }

  try {
    const jwtToken = "A_VALID_JWT_TOKEN"; 

    const orderPayload = {
        "variety": "NORMAL",
        "tradingsymbol": symbol,
        "symboltoken": "3045",
        "transactiontype": side.toUpperCase(),
        "exchange": exchange,
        "ordertype": "MARKET",
        "producttype": productType,
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

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
