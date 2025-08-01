'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/auth-helpers-nextjs';
import Header from '../components/Header';
import BacktestControls from '../components/BacktestControls';
import BacktestResults, { type BacktestResult } from '../components/BacktestResults';
import { calculateIndicators, type Candle } from '../../lib/indicators';
import { runBacktest } from '../../lib/backtestEngine';

export default function BacktestPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  const supabase = createClientComponentClient();
  const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;

  // Effect to get the user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, [supabase.auth]);

  // In app/backtest/page.tsx

  const handleRunBacktest = async (config: any) => {
    setLoading(true);
    setBacktestResult(null);

    // 1. Fetch historical data from FMP API
    const { stock, timeframe, startDate, endDate } = config; // Get dates from config
    
    // --- NEW: Updated URL with date range ---
    const url = `https://financialmodelingprep.com/api/v3/historical-chart/${timeframe}/${stock}?from=${startDate}&to=${endDate}&apikey=${FMP_API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Try to get a more helpful error message from the API
        const errorData = await response.json();
        const errorMessage = errorData?.['Error Message'] || 'Failed to fetch historical data.';
        throw new Error(errorMessage);
      }
      
      const historicalData: Candle[] = await response.json();
      if (!historicalData || historicalData.length === 0) {
        throw new Error('No data returned for this stock in the selected date range. Check the ticker symbol and dates.');
      }

      // 2. Calculate technical indicators
      const enrichedData = calculateIndicators(historicalData);

      // 3. Run the backtesting engine
      const result = runBacktest(enrichedData, config.strategy, config.portfolio);

      setBacktestResult(result);
    } catch (error: any) {
      alert(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Header session={session} onLoginClick={() => setIsModalOpen(true)} />
      <main className="flex flex-col md:flex-row flex-grow p-4 gap-4">
        {/* Left Panel: Controls */}
        <section className="w-full md:w-1/3 lg:w-1/4 bg-slate-800 rounded-xl p-4">
          <h2 className="text-xl font-bold mb-4">Backtest Setup</h2>
          <BacktestControls session={session} onRunBacktest={handleRunBacktest} />
        </section>

        {/* Right Panel: Results */}
        <section className="w-full md:w-2/3 lg:w-3/4 bg-slate-800 rounded-xl p-4">
           <h2 className="text-xl font-bold mb-4">Results</h2>
           <BacktestResults result={backtestResult} loading={loading} />
        </section>
      </main>
    </div>
  );
}