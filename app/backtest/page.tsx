'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/auth-helpers-nextjs';
import Header from '../components/Header';
import BacktestControls, { type PortfolioBacktestConfig } from '../components/BacktestControls';
import BacktestResults, { type BacktestResult } from '../components/BacktestResults';
import { enrichCandlesWithIndicators, type Candle } from '../../lib/indicatorManager';
import { runBacktest } from '../../lib/backtestEngine';
import { type StrategyFromDB } from '../components/SavedStrategies';
import LoginModal from '../components/LoginModal';

// --- THIS IS THE FIX ---
// Define which timeframes require the Angel One "Deep Testing"
const PREMIUM_TIMEFRAMES = ['TEN_MINUTE', 'THREE_MINUTE'];
const ALPHA_VANTAGE_SUPPORTED_TIMEFRAMES: Record<string, string> = {
    'ONE_DAY': 'TIME_SERIES_DAILY',
    'ONE_HOUR': 'TIME_SERIES_INTRADAY',
    'THIRTY_MINUTE': 'TIME_SERIES_INTRADAY',
    'FIFTEEN_MINUTE': 'TIME_SERIES_INTRADAY',
    'FIVE_MINUTE': 'TIME_SERIES_INTRADAY',
    'ONE_MINUTE': 'TIME_SERIES_INTRADAY',
};
const ALPHA_VANTAGE_INTERVAL_MAP: Record<string, string> = {
    'ONE_HOUR': '60min',
    'THIRTY_MINUTE': '30min',
    'FIFTEEN_MINUTE': '15min',
    'FIVE_MINUTE': '5min',
    'ONE_MINUTE': '1min',
};


export default function BacktestPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<StrategyFromDB[]>([]);
  const [brokerConnected, setBrokerConnected] = useState(false);

  const supabase = createClientComponentClient();
  const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

  useEffect(() => {
    const getSessionAndData = async (currentSession: Session | null) => {
      setSession(currentSession);
      if (currentSession) {
        const { data: strategiesData } = await supabase.from('strategies').select('*').eq('user_id', currentSession.user.id);
        if (strategiesData) setSavedStrategies(strategiesData as StrategyFromDB[]);
        
        const { data: config } = await supabase.from('broker_config').select('id').eq('user_id', currentSession.user.id).single();
        if (config) setBrokerConnected(true);
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      getSessionAndData(session);
    });
  }, [supabase]);

  const fetchHistoricalData = async (stock: string, timeframe: string, startDate: string, endDate: string, useDeepTest: boolean): Promise<Candle[]> => {
    if (useDeepTest) {
      const response = await fetch('/api/angelone/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: stock, timeframe, startDate, endDate }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch data from Angel One.');
      return data;
    } else {
      const avFunction = ALPHA_VANTAGE_SUPPORTED_TIMEFRAMES[timeframe];
      const avInterval = ALPHA_VANTAGE_INTERVAL_MAP[timeframe];
      let url = `https://www.alphavantage.co/query?function=${avFunction}&symbol=${stock}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
      if (avInterval) url += `&interval=${avInterval}`;
      
      const response = await fetch(url);
      const rawData = await response.json();
      const dataKey = Object.keys(rawData).find(key => key.includes('Time Series'));
      if (!dataKey) throw new Error(rawData['Note'] || 'Failed to fetch data from Alpha Vantage.');

      return Object.entries(rawData[dataKey])
        .map(([date, values]: [string, any]) => ({ date, open: parseFloat(values['1. open']), high: parseFloat(values['2. high']), low: parseFloat(values['3. low']), close: parseFloat(values['4. close']), volume: parseInt(values['5. volume']) }))
        .filter(c => new Date(c.date) >= new Date(startDate) && new Date(c.date) <= new Date(endDate));
    }
  };

  const handleRunBacktest = async (config: PortfolioBacktestConfig, useDeepTest: boolean) => {
    // --- THIS IS THE FIX ---
    // Check if a premium timeframe was selected without Deep Testing
    if (PREMIUM_TIMEFRAMES.includes(config.timeframe) && !useDeepTest) {
        alert('This timeframe is only available with Deep Testing. Please connect your Angel One account to use this feature.');
        return;
    }
    
    setLoading(true);
    setBacktestResult(null);

    try {
      const allStockData = await Promise.all(
        config.stocks.map(stock => 
          fetchHistoricalData(stock.symbol, config.timeframe, config.startDate, config.endDate, useDeepTest)
        )
      );

      let aggregatedTrades: any[] = [];
      let totalInitialCapital = 0;
      let totalFinalCapital = 0;

      config.stocks.forEach((stock, index) => {
        const historicalData = allStockData[index];
        if (historicalData.length === 0) return;
        const initialCapital = config.allocationType === 'static' ? stock.amount || 0 : config.totalCapital / config.stocks.length;
        totalInitialCapital += initialCapital;
        const enrichedData = enrichCandlesWithIndicators(historicalData, config.strategy);
        const result = runBacktest(enrichedData, config.strategy.config, initialCapital, stock.symbol);
        aggregatedTrades = [...aggregatedTrades, ...result.trades];
        totalFinalCapital += result.finalPortfolio;
      });

      if (totalInitialCapital === 0) throw new Error("No capital allocated or data found for selected stocks.");
      const totalWins = aggregatedTrades.filter(t => t.pnl && t.pnl > 0).length;
      const totalBuyTrades = aggregatedTrades.filter(t => t.type === 'buy').length;

      setBacktestResult({
        trades: aggregatedTrades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        finalPortfolio: totalFinalCapital,
        performance: ((totalFinalCapital - totalInitialCapital) / totalInitialCapital) * 100,
        winRate: totalBuyTrades > 0 ? (totalWins / totalBuyTrades) * 100 : 0,
        totalTrades: totalBuyTrades,
      });

    } catch (error: any) {
      alert(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <Header session={session} onLoginClick={() => setIsModalOpen(true)} />
      <main className="flex flex-col md:flex-row flex-grow p-4 gap-4">
        <section className="w-full md:w-1/3 lg:w-1/4 bg-slate-800 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">Portfolio Backtest</h2>
          <BacktestControls session={session} brokerConnected={brokerConnected} savedStrategies={savedStrategies} onRunBacktest={handleRunBacktest} />
        </section>
        <section className="w-full md:w-2/3 lg:w-3/4 bg-slate-800 rounded-xl p-4">
           <h2 className="text-xl font-bold mb-4">Results</h2>
           <BacktestResults result={backtestResult} loading={loading} />
        </section>
      </main>
    </div>
  );
}
