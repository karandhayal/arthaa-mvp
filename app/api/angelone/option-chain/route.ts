// In app/api/angelone/option-chain/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// This is a placeholder for fetching live option chain data from Angel One.
// A real implementation would require a live, authenticated API call.
async function fetchMockOptionChain(symbol: string) {
    // In a real application, you would make an API call to Angel One here.
    // For this MVP, we will return a realistic but mock data structure.
    console.log(`Fetching mock option chain for: ${symbol}`);
    
    // Example: NIFTY is at 23,000
    const basePrice = 23000;
    const expiryDate = "28AUG2025";
    const strikes = [22800, 22900, 23000, 23100, 23200];
    
    return strikes.map(strike => {
        const callPremium = Math.max(5, basePrice - strike + 150);
        const putPremium = Math.max(5, strike - basePrice + 120);

        return {
            strikePrice: strike,
            expiryDate: expiryDate,
            call: {
                symbol: `NIFTY${expiryDate}${strike}CE`,
                ltp: callPremium,
                oi: Math.floor(Math.random() * 50000) + 10000,
            },
            put: {
                symbol: `NIFTY${expiryDate}${strike}PE`,
                ltp: putPremium,
                oi: Math.floor(Math.random() * 50000) + 10000,
            }
        };
    });
}


export async function POST(request: Request) {
  const { symbol } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // NOTE: You would normally need the user's JWT token to make this call.
  // We are skipping that for the mock data version.

  try {
    const optionChainData = await fetchMockOptionChain(symbol);
    return NextResponse.json(optionChainData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
