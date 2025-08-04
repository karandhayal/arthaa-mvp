'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type StrategyFromDB } from './SavedStrategies';
import { FiX, FiPlus, FiDollarSign, FiActivity, FiZap } from 'react-icons/fi';

// This interface defines the shape of the advanced configuration
export interface PortfolioBacktestConfig {
  strategy: StrategyFromDB;
  timeframe: string;
  startDate: string;
  endDate: string;
  allocationType: 'static' | 'dynamic';
  totalCapital: number;
  stocks: {
    symbol: string;
    amount?: number;
  }[];
}

type BacktestControlsProps = {
  session: any; // Session | null
  brokerConnected: boolean;
  savedStrategies: StrategyFromDB[];
  onRunBacktest: (config: PortfolioBacktestConfig, useDeepTest: boolean) => void;
};

export default function BacktestControls({ session, brokerConnected, savedStrategies, onRunBacktest }: BacktestControlsProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyFromDB | null>(null);
  const [timeframe, setTimeframe] = useState('ONE_DAY'); 
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2023-12-31');
  
  const [stocks, setStocks] = useState<string[]>([]);
  const [currentStock, setCurrentStock] = useState('');
  const [allocationType, setAllocationType] = useState<'dynamic' | 'static'>('dynamic');
  const [staticAllocations, setStaticAllocations] = useState<Record<string, number>>({});
  const [dynamicCapital, setDynamicCapital] = useState(100000);

  const router = useRouter();

  const totalStaticCapital = useMemo(() => {
    return Object.values(staticAllocations).reduce((sum, amount) => sum + (amount || 0), 0);
  }, [staticAllocations]);

  const handleAddStock = () => {
    if (currentStock && !stocks.includes(currentStock.toUpperCase())) {
      setStocks([...stocks, currentStock.toUpperCase()]);
      setCurrentStock('');
    }
  };
  
  const handleRemoveStock = (stockToRemove: string) => {
    setStocks(stocks.filter(s => s !== stockToRemove));
    const newAllocations = { ...staticAllocations };
    delete newAllocations[stockToRemove];
    setStaticAllocations(newAllocations);
  };

  const handleRun = (useDeepTest: boolean) => {
    if (!selectedStrategy) {
      alert('Please select a strategy to run.');
      return;
    }
    if (stocks.length === 0) {
      alert('Please add at least one stock.');
      return;
    }
    if (useDeepTest && !brokerConnected) {
      alert('Please connect your Angel One account on the Account page to use Deep Testing.');
      router.push('/account');
      return;
    }

    const config: PortfolioBacktestConfig = {
      strategy: selectedStrategy,
      timeframe,
      startDate,
      endDate,
      allocationType,
      totalCapital: allocationType === 'dynamic' ? dynamicCapital : totalStaticCapital,
      stocks: stocks.map(symbol => ({
        symbol,
        ...(allocationType === 'static' && { amount: staticAllocations[symbol] || 0 }),
      })),
    };
    onRunBacktest(config, useDeepTest);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Strategy Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">1. Select a Strategy</label>
        <select value={selectedStrategy?.id || ''} onChange={(e) => setSelectedStrategy(savedStrategies.find(s => s.id === e.target.value) || null)} className="w-full bg-slate-700 p-2 rounded-md">
          <option value="" disabled>Choose a saved strategy</option>
          {savedStrategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Stock Selection */}
      <div>
        <label className="block text-sm font-medium mb-1">2. Select Stocks (BSE)</label>
        <div className="flex gap-2">
            <input type="text" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddStock()} className="w-full bg-slate-700 p-2 rounded-md" placeholder="e.g., INFY.BSE, press Enter"/>
            <button onClick={handleAddStock} className="bg-emerald-500 hover:bg-emerald-600 p-2 rounded-md"><FiPlus size={20} /></button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
            {stocks.map(stock => (
                <div key={stock} className="bg-slate-600 flex items-center gap-2 pl-3 pr-1 py-1 rounded-full text-sm">
                    <span>{stock}</span>
                    <button onClick={() => handleRemoveStock(stock)} className="bg-slate-700 hover:bg-red-500 rounded-full p-0.5"><FiX size={14} /></button>
                </div>
            ))}
        </div>
      </div>
      
      {/* Capital Allocation */}
      <div>
        <label className="block text-sm font-medium mb-2">3. Capital Allocation</label>
        <div className="flex bg-slate-700 rounded-lg p-1">
            <button onClick={() => setAllocationType('dynamic')} className={`flex-1 flex items-center justify-center gap-2 text-sm p-2 rounded-md ${allocationType === 'dynamic' ? 'bg-emerald-500' : 'hover:bg-slate-600'}`}><FiActivity /> Dynamic</button>
            <button onClick={() => setAllocationType('static')} className={`flex-1 flex items-center justify-center gap-2 text-sm p-2 rounded-md ${allocationType === 'static' ? 'bg-emerald-500' : 'hover:bg-slate-600'}`}><FiDollarSign /> Static</button>
        </div>
         <div className="mt-2">
            {allocationType === 'dynamic' ? (
                <input type="number" value={dynamicCapital} onChange={(e) => setDynamicCapital(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md" placeholder="Total Capital (₹)"/>
            ) : (
                <div className="space-y-2 p-2 bg-slate-700/50 rounded-md">
                    {stocks.map(stock => (
                        <div key={stock} className="flex items-center gap-2">
                            <span className="w-1/3 text-slate-400">{stock}</span>
                            <input type="number" value={staticAllocations[stock] || ''} onChange={(e) => setStaticAllocations({...staticAllocations, [stock]: Number(e.target.value)})} className="w-2/3 bg-slate-700 p-2 rounded-md" placeholder="e.g., 5000"/>
                        </div>
                    ))}
                    <div className="text-right text-sm font-bold pt-2">Total: ₹{totalStaticCapital.toLocaleString('en-IN')}</div>
                </div>
            )}
        </div>
      </div>

      {/* --- THIS IS THE FIX --- */}
      {/* Date & Timeframe */}
      <div>
        <label className="block text-sm font-medium mb-1">4. Time & Date Range</label>
        <div className="flex gap-4">
            <div className="w-full">
                <label className="block text-xs font-medium mb-1 text-slate-400">Timeframe</label>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md">
                    <option value="ONE_DAY">1 Day</option>
                    <option value="ONE_HOUR">1 Hour</option>
                    <option value="THIRTY_MINUTE">30 Minute</option>
                    <option value="FIFTEEN_MINUTE">15 Minute</option>
                    <option value="TEN_MINUTE">10 Minute</option>
                    <option value="FIVE_MINUTE">5 Minute</option>
                    <option value="THREE_MINUTE">3 Minute</option>
                    <option value="ONE_MINUTE">1 Minute</option>
                </select>
            </div>
        </div>
        <div className="flex gap-4 mt-2">
            <div className="w-1/2">
                <label className="block text-xs font-medium mb-1 text-slate-400">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md"/>
            </div>
            <div className="w-1/2">
                <label className="block text-xs font-medium mb-1 text-slate-400">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md"/>
            </div>
        </div>
      </div>

      {/* Run Buttons */}
      <div className="mt-auto pt-4 border-t border-slate-700 space-y-3">
          <button onClick={() => handleRun(false)} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity">
            Run Backtest
          </button>
           <button onClick={() => handleRun(true)} className="w-full py-3 bg-gradient-to-r from-purple-500 to-violet-600 font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <FiZap /> Deep Testing (via Angel One)
          </button>
      </div>
    </div>
  );
}
