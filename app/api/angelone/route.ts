// FILE: app/api/angelone/route.ts
import { createClient } from '@/lib/supabase/server'; // IMPORT our helper
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { symbol, qty, side, exchange, productType, symbolToken } = await request.json();
  
  // --- FIX: Use the new helper function to create the client ---
  const supabase = createClient();
  // --- END of FIX ---

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: config } = await supabase
    .from('broker_config')
    .select('api_key, jwt_token') // Select only the keys you need
    .eq('user_id', session.user.id)
    .single();

  // More robust check for required config values
  if (!config || !config.api_key || !config.jwt_token) {
    return NextResponse.json({ error: 'Angel One configuration not found or session is invalid.' }, { status: 400 });
  }

  try {
    // --- BUG FIX: Use the actual JWT token from the database ---
    const jwtToken = config.jwt_token; 

    const orderPayload = {
        "variety": "NORMAL",
        "tradingsymbol": symbol,
        "symboltoken": symbolToken, // Make sure to pass this from the frontend
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
    if (!result.status || result.status === false) {
        throw new Error(result.message || 'Failed to place order.');
    }

    return NextResponse.json(result.data);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error("Error placing order:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}