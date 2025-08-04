// In app/api/engine/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { enrichCandlesWithIndicators } from '../../../lib/indicatorManager';
import { runBacktest } from '../../../lib/backtestEngine'; // We can reuse the core logic

// This is the main endpoint that will be called to run the trading engine.
// In production, you would set up a cron job to call this endpoint periodically.
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 1. Fetch all active strategies from the database, grouped by user
    const { data: activeStrategies, error } = await supabase
      .from('live_strategies')
      .select(`
        *,
        user_id,
        strategies ( * ),
        broker_config ( * )
      `)
      .eq('status', 'active');

    if (error) throw new Error(`Error fetching active strategies: ${error.message}`);
    if (!activeStrategies || activeStrategies.length === 0) {
      return NextResponse.json({ message: 'No active strategies to process.' });
    }

    // Process strategies for each user
    for (const strategy of activeStrategies) {
      // In a real-world scenario, you would process these in parallel or via a job queue.
      await processStrategy(strategy, supabase);
    }

    return NextResponse.json({ status: 'success', message: 'Engine run completed.' });

  } catch (error: any) {
    console.error('Trading Engine Error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

// This function processes a single active strategy.
async function processStrategy(strategy: any, supabase: any) {
  const { user_id, strategies: strategyDetails, broker_config, allocation_config } = strategy;
  
  if (!broker_config || broker_config.length === 0) {
    await logTrade(supabase, user_id, strategy.id, 'error', 'N/A', 'Broker configuration not found.');
    return;
  }
  
  const broker = broker_config[0];

  try {
    // --- This is a placeholder for the full Angel One session generation ---
    // In a real app, you would use the refresh_token to get a new jwt_token if the current one is expired.
    const jwtToken = broker.jwt_token;
    if (!jwtToken) {
        await logTrade(supabase, user_id, strategy.id, 'error', 'N/A', 'User is not logged into Angel One.');
        return;
    }

    // For each stock in the strategy's allocation
    for (const stock of allocation_config.stocks) {
      // 1. Fetch latest market data (we'll simulate this with historical data for the MVP)
      // In production, you would use Angel One's WebSocket for real-time ticks.
      const historicalData = await getHistoricalData(stock.symbol);

      // 2. Calculate indicators
      const enrichedData = enrichCandlesWithIndicators(historicalData, { config: strategyDetails.config });
      const latestCandle = enrichedData[enrichedData.length - 1];
      const prevCandle = enrichedData[enrichedData.length - 2];

      // 3. Evaluate strategy logic
      // We can reuse the backtesting engine's evaluation logic.
      const entryResult = evaluateGroup(strategyDetails.config.entryLogic, latestCandle, prevCandle);
      const exitResult = evaluateGroup(strategyDetails.config.exitLogic, latestCandle, prevCandle);

      // --- TODO: Check for existing open positions for this stock/strategy ---
      const hasOpenPosition = false; // This would be checked against a 'live_positions' table

      if (!hasOpenPosition && entryResult.met) {
        // --- Place BUY Order ---
        const reason = entryResult.reasons.join(` ${strategyDetails.config.entryLogic.logic} `);
        // await placeOrder(broker, jwtToken, stock.symbol, 'BUY', 1); // Example quantity
        await logTrade(supabase, user_id, strategy.id, 'buy', stock.symbol, reason, 1, latestCandle.close);
      } else if (hasOpenPosition && exitResult.met) {
        // --- Place SELL Order ---
        const reason = exitResult.reasons.join(` ${strategyDetails.config.exitLogic.logic} `);
        // await placeOrder(broker, jwtToken, stock.symbol, 'SELL', 1);
        await logTrade(supabase, user_id, strategy.id, 'sell', stock.symbol, reason, 1, latestCandle.close);
      }
    }
  } catch (error: any) {
    await logTrade(supabase, user_id, strategy.id, 'error', 'System', error.message);
  }
}

// --- Helper Functions (Placeholders & Simplified Logic for MVP) ---

// Placeholder for fetching historical data from Angel One
async function getHistoricalData(symbol: string) {
    // In a real app, this would call the Angel One historical data API.
    // For this MVP, we'll return some mock data.
    return [
        { date: '2023-01-01T10:00:00.000Z', open: 100, high: 102, low: 99, close: 101, volume: 1000 },
        { date: '2023-01-02T10:00:00.000Z', open: 101, high: 103, low: 100, close: 102, volume: 1200 },
    ];
}

// Placeholder for the recursive evaluation logic (should be imported from backtestEngine)
function evaluateGroup(group: any, candle: any, prevCandle: any): { met: boolean; reasons: string[] } {
    // This is a simplified placeholder. The full logic from backtestEngine.ts would be used here.
    if (group.rules.length > 0) {
        // Simulate a condition being met for demonstration purposes
        if (candle.close > prevCandle.close) {
            return { met: true, reasons: ["Price increased"] };
        }
    }
    return { met: false, reasons: [] };
}

// Helper to log every action to the database
async function logTrade(supabase: any, userId: string, liveStrategyId: string, type: string, symbol: string, reason: string, qty?: number, price?: number) {
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
