'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/auth-helpers-nextjs';
import { type StrategyFromDB } from './SavedStrategies'; 

interface BacktestConfig {
  strategy: StrategyFromDB;
  portfolio: number;
  timeframe: string;
  stock: string;
  startDate: string;
  endDate: string;
}

type BacktestControlsProps = {
  session: Session | null;
  onRunBacktest: (config: BacktestConfig) => void;
};

export default function BacktestControls({ session, onRunBacktest }: BacktestControlsProps) {
  const [strategies, setStrategies] = useState<StrategyFromDB[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyFromDB | null>(null);
  const [portfolio, setPortfolio] = useState(100000); // Updated to a more common portfolio size in INR
  const [timeframe, setTimeframe] = useState('1day');
  // --- THIS IS THE CHANGE ---
  const [stock, setStock] = useState('RELIANCE.NS'); // Default to a popular Indian stock
  
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (session) {
      const fetchStrategies = async () => {
        const { data } = await supabase.from('strategies').select('*').eq('user_id', session.user.id);
        if (data) setStrategies(data as StrategyFromDB[]);
      };
      fetchStrategies();
    }
  }, [session, supabase]);

  const handleRun = () => {
    if (!selectedStrategy) {
      alert('Please select a strategy to run.');
      return;
    }
    onRunBacktest({
      strategy: selectedStrategy,
      portfolio,
      timeframe,
      stock,
      startDate,
      endDate,
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <label className="block text-sm font-medium mb-1">Stock Ticker (NSE)</label>
        <input 
            type="text" 
            value={stock} 
            onChange={(e) => setStock(e.target.value.toUpperCase())} 
            className="w-full bg-slate-700 p-2 rounded-md" 
            // --- THIS IS THE CHANGE ---
            placeholder="e.g., RELIANCE.NS"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Initial Portfolio (₹)</label>
        <input type="number" value={portfolio} onChange={(e) => setPortfolio(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md"/>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Timeframe</label>
        <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md">
          <option value="1day">Daily</option>
          <option value="4hour">4 Hour</option>
          <option value="1hour">1 Hour</option>
        </select>
      </div>
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md"/>
        </div>
      </div>
      <div className="flex-grow flex flex-col">
        <h3 className="font-semibold mb-2">Load a Strategy</h3>
        <div className="bg-slate-900 p-3 rounded-lg overflow-y-auto flex-grow">
          {strategies.length > 0 ? (
            <ul className="space-y-2">
              {strategies.map((s) => (
                <li key={s.id}>
                  <button onClick={() => setSelectedStrategy(s)} className={`w-full text-left p-2 rounded-md text-sm transition-colors ${selectedStrategy?.id === s.id ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">No strategies found.</p>
          )}
        </div>
      </div>
      <button onClick={handleRun} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity">
        Run Backtest
      </button>
    </div>
  );
}
