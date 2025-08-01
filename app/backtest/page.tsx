'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/auth-helpers-nextjs';
import Header from '../components/Header';
import BacktestControls from '../components/BacktestControls';
import BacktestResults, { type BacktestResult } from '../components/BacktestResults';
import { calculateIndicators, type Candle } from '../../lib/indicators';
import { runBacktest } from '../../lib/backtestEngine';
import { type StrategyFromDB } from '../components/SavedStrategies';
import LoginModal from '../components/LoginModal';

// Define a specific type for the backtest configuration
interface BacktestConfig {
  strategy: StrategyFromDB;
  portfolio: number;
  timeframe: string;
  stock: string;
  startDate: string;
  endDate: string;
}

export default function BacktestPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  const supabase = createClientComponentClient();
  const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY;

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, [supabase.auth]);

  const handleRunBacktest = async (config: BacktestConfig) => {
    setLoading(true);
    setBacktestResult(null);

    const { stock, timeframe, startDate, endDate } = config;
    const url = `https://financialmodelingprep.com/api/v3/historical-chart/${timeframe}/${stock}?from=${startDate}&to=${endDate}&apikey=${FMP_API_KEY}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.['Error Message'] || 'Failed to fetch historical data.';
        throw new Error(errorMessage);
      }

      const historicalData: Candle[] = await response.json();
      if (!historicalData || historicalData.length === 0) {
        throw new Error('No data returned for this stock in the selected date range. Check the ticker symbol and dates.');
      }

      const enrichedData = calculateIndicators(historicalData);
      const result = runBacktest(enrichedData, config.strategy.config, config.portfolio);

      setBacktestResult(result);
    } catch (error: unknown) { // <-- THIS IS THE FIX (changed from any to unknown)
        if (error instanceof Error) {
            alert(`An error occurred: ${error.message}`);
        } else {
            alert('An unknown error occurred.');
        }
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
          <h2 className="text-xl font-bold mb-4">Backtest Setup</h2>
          <BacktestControls session={session} onRunBacktest={handleRunBacktest} />
        </section>
        <section className="w-full md:w-2/3 lg:w-3/4 bg-slate-800 rounded-xl p-4">
           <h2 className="text-xl font-bold mb-4">Results</h2>
           <BacktestResults result={backtestResult} loading={loading} />
        </section>
      </main>
    </div>