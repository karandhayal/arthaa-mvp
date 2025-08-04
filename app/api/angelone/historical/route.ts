// In app/api/angelone/historical/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// This is a simplified mapping. A real app would need a full instrument list from Angel One.
const SYMBOL_TOKEN_MAP: { [key: string]: string } = {
    'RELIANCE.BSE': '1330',
    'TCS.BSE': '11536',
    'INFY.BSE': '1594',
    'HDFCBANK.BSE': '1333',
};

export async function POST(request: Request) {
  const { symbol, timeframe, startDate, endDate } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  // 1. Get the current user session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Securely fetch the user's Angel One credentials
  const { data: config } = await supabase
    .from('broker_config')
    .select('api_key, jwt_token')
    .eq('user_id', session.user.id)
    .single();

  if (!config || !config.jwt_token) {
    return NextResponse.json({ error: 'Angel One connection not found or session expired.' }, { status: 400 });
  }

  // 3. Prepare the request for Angel One's Historical API
  const symbolToken = SYMBOL_TOKEN_MAP[symbol.toUpperCase()];
  if (!symbolToken) {
      return NextResponse.json({ error: `Symbol token not found for ${symbol}.` }, { status: 400 });
  }

  const intervalMap = {
      '1day': 'ONE_DAY',
      '1hour': 'ONE_HOUR',
  };

  const payload = {
    "exchange": "BSE",
    "symboltoken": symbolToken,
    "interval": intervalMap[timeframe as keyof typeof intervalMap],
    "fromdate": startDate,
    "todate": endDate
  };

  try {
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/historical/v1/getCandleData', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${config.jwt_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-PrivateKey': config.api_key,
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.status || !result.data) {
        throw new Error(result.message || 'Failed to fetch historical data from Angel One.');
    }

    // 4. Reformat the data to match the structure your backtester expects
    const formattedData = result.data.map((candle: any[]) => ({
        date: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
    }));

    return NextResponse.json(formattedData);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
