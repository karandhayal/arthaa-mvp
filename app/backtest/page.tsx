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
  const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

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

    if (stock.toUpperCase().endsWith('.NS')) {
        alert(`Invalid ticker format for the current data provider. Please use the Bombay Stock Exchange (BSE) suffix, for example: ${stock.toUpperCase().replace('.NS', '.BSE')}`);
        setLoading(false);
        return;
    }

    // --- THIS IS THE FIX ---
    // The logic is updated to handle valid timeframes and prevent invalid API calls.
    let avFunction = '';
    let avInterval = '';

    if (timeframe === '1day') {
        avFunction = 'TIME_SERIES_DAILY';
    } else if (timeframe === '1hour') {
        avFunction = 'TIME_SERIES_INTRADAY';
        avInterval = '60min';
    } else if (timeframe === '4hour') {
        // Alert the user that this timeframe is not supported and stop execution.
        alert('The 4-hour timeframe is not supported by the current free data provider. Please select Daily or 1 Hour.');
        setLoading(false);
        return;
    }

    let url = `https://www.alphavantage.co/query?function=${avFunction}&symbol=${stock}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`;
    if (avFunction === 'TIME_SERIES_INTRADAY') {
        url += `&interval=${avInterval}`;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch historical data from Alpha Vantage.');
      }
      
      const rawData = await response.json();
      const dataKey = Object.keys(rawData).find(key => key.includes('Time Series'));
      if (!dataKey || !rawData[dataKey]) {
        throw new Error(rawData['Note'] || rawData['Error Message'] || 'No data returned. The free Alpha Vantage API has a limit of 25 requests per day or the ticker symbol is invalid.');
      }

      const historicalData: Candle[] = Object.entries(rawData[dataKey])
        .map(([date, values]: [string, any]) => ({
            date: date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume']),
        }))
        .filter(candle => new Date(candle.date) >= new Date(startDate) && new Date(candle.date) <= new Date(endDate));

      if (historicalData.length === 0) {
        throw new Error('No data found for the selected date range.');
      }

      const enrichedData = calculateIndicators(historicalData);
      const result = runBacktest(enrichedData, config.strategy.config, config.portfolio);

      setBacktestResult(result);
    } catch (error: unknown) { // More robust error handling
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
  );
}
