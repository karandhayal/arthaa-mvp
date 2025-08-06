import { createRouteHandlerClient, SupabaseClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { enrichCandlesWithIndicators } from '../../../lib/indicatorManager';
import { type RuleGroup } from '../../../app/components/types';
import { type StrategyFromDB } from '../../../app/components/SavedStrategies';

type LiveStrategyPayload = {
  id: string;
  user_id: string;
  allocation_config: { stocks: { symbol: string }[] };
  strategies: StrategyFromDB;
  broker_config: { jwt_token: string }[];
};

// ✅ Added this
type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: activeStrategies, error } = await supabase
      .from('live_strategies')
      .select(`*, strategies ( * ), broker_config ( * )`)
      .eq('status', 'active');

    if (error) throw new Error(`Error fetching active strategies: ${error.message}`);
    if (!activeStrategies || activeStrategies.length === 0) {
      return NextResponse.json({ message: 'No active strategies to process.' });
    }

    for (const strategy of activeStrategies) {
      await processStrategy(strategy as LiveStrategyPayload, supabase);
    }

    return NextResponse.json({ status: 'success', message: 'Engine run completed.' });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Trading Engine Error:', errorMessage);
    return NextResponse.json({ status: 'error', message: errorMessage }, { status: 500 });
  }
}

async function processStrategy(strategy: LiveStrategyPayload, supabase: SupabaseClient) {
  const { user_id, strategies: strategyDetails, broker_config, allocation_config } = strategy;

  if (!broker_config || broker_config.length === 0) {
    await logTrade(supabase, user_id, strategy.id, 'error', 'N/A', 'Broker configuration not found.');
    return;
  }

  const broker = broker_config[0];

  try {
    const jwtToken = broker.jwt_token;

    if (!jwtToken) {
      await logTrade(supabase, user_id, strategy.id, 'error', 'N/A', 'User is not logged into Angel One.');
      return;
    }

    for (const stock of allocation_config.stocks) {
      const historicalData = await getHistoricalData();
      const enrichedData = enrichCandlesWithIndicators(historicalData, { config: strategyDetails.config });

      const latestCandle = enrichedData[enrichedData.length - 1] as Candle;
      const prevCandle = enrichedData[enrichedData.length - 2] as Candle;

      const entryResult = evaluateGroup(strategyDetails.config.entryLogic, latestCandle, prevCandle);
      const exitResult = evaluateGroup(strategyDetails.config.exitLogic, latestCandle, prevCandle);

      const hasOpenPosition = false;

      if (!hasOpenPosition && entryResult.met) {
        const reason = entryResult.reasons.join(` ${strategyDetails.config.entryLogic.logic} `);
        await logTrade(supabase, user_id, strategy.id, 'buy', stock.symbol, reason, 1, latestCandle.close);
      } else if (hasOpenPosition && exitResult.met) {
        const reason = exitResult.reasons.join(` ${strategyDetails.config.exitLogic.logic} `);
        await logTrade(supabase, user_id, strategy.id, 'sell', stock.symbol, reason, 1, latestCandle.close);
      }
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    await logTrade(supabase, user_id, strategy.id, 'error', 'System', errorMessage);
  }
}

async function getHistoricalData(): Promise<Candle[]> {
  return [
    { date: '2023-01-01T10:00:00.000Z', open: 100, high: 102, low: 99, close: 101, volume: 1000 },
    { date: '2023-01-02T10:00:00.000Z', open: 101, high: 103, low: 100, close: 102, volume: 1200 },
  ];
}

function evaluateGroup(group: RuleGroup, candle: Candle, prevCandle: Candle): { met: boolean; reasons: string[] } {
  if (group.rules.length > 0 && candle.close > prevCandle.close) {
    return { met: true, reasons: ["Price increased"] };
  }
  return { met: false, reasons: [] };
}

async function logTrade(
  supabase: SupabaseClient,
  userId: string,
  liveStrategyId: string,
  type: string,
  symbol: string,
  reason: string,
  qty?: number,
  price?: number
) {
  await supabase.from('trade_logs').insert({
    user_id: userId,
    live_strategy_id: liveStrategyId,
    trade_type: type,
    stock_symbol: symbol,
    quantity: qty,
    price: price,
    status: type === 'error' ? 'failed' : 'success',
    reason: reason,
  });
}
