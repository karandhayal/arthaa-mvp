// In app/components/DeployModal.tsx
'use client';

import { useState, useMemo } from 'react';
import { type StrategyFromDB } from './SavedStrategies';
import { FiX, FiPlus, FiDollarSign, FiActivity } from 'react-icons/fi';

export interface AllocationConfig {
  allocationType: 'static' | 'dynamic';
  totalCapital: number;
  stocks: {
    symbol: string;
    amount?: number;
  }[];
}

type DeployModalProps = {
  isOpen: boolean;
  onClose: () => void;
  strategy: StrategyFromDB | null;
  onConfirmDeploy: (config: AllocationConfig) => void;
};

export default function DeployModal({ isOpen, onClose, strategy, onConfirmDeploy }: DeployModalProps) {
  const [stocks, setStocks] = useState<string[]>([]);
  const [currentStock, setCurrentStock] = useState('');
  const [allocationType, setAllocationType] = useState<'static' | 'dynamic'>('dynamic');
  const [staticAllocations, setStaticAllocations] = useState<Record<string, number>>({});
  const [dynamicCapital, setDynamicCapital] = useState(100000);

  const totalStaticCapital = useMemo(() => {
    return Object.values(staticAllocations).reduce((sum, amount) => sum + (amount || 0), 0);
  }, [staticAllocations]);

  if (!isOpen || !strategy) return null;

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

  const handleConfirm = () => {
    if (stocks.length === 0) {
      alert('Please add at least one stock.');
      return;
    }

    const config: AllocationConfig = {
      allocationType,
      totalCapital: allocationType === 'dynamic' ? dynamicCapital : totalStaticCapital,
      stocks: stocks.map(symbol => ({
        symbol,
        ...(allocationType === 'static' && { amount: staticAllocations[symbol] || 0 }),
      })),
    };
    onConfirmDeploy(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-lg relative max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Deploy Strategy</h2>
          <p className="text-sm text-slate-400">{`Deploy "${strategy.name}" to the live market.`}</p>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><FiX size={24} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Select Stocks (BSE)</label>
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

          <div>
            <label className="block text-sm font-medium mb-2">Capital Allocation Method</label>
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button onClick={() => setAllocationType('dynamic')} className={`flex-1 flex items-center justify-center gap-2 text-sm p-2 rounded-md ${allocationType === 'dynamic' ? 'bg-emerald-500' : 'hover:bg-slate-600'}`}><FiActivity /> Dynamic</button>
              <button onClick={() => setAllocationType('static')} className={`flex-1 flex items-center justify-center gap-2 text-sm p-2 rounded-md ${allocationType === 'static' ? 'bg-emerald-500' : 'hover:bg-slate-600'}`}><FiDollarSign /> Static</button>
            </div>
          </div>

          {allocationType === 'dynamic' ? (
            <div>
              <label className="block text-sm font-medium mb-1">Total Capital for Strategy (₹)</label>
              <input type="number" value={dynamicCapital} onChange={(e) => setDynamicCapital(Number(e.target.value))} className="w-full bg-slate-700 p-2 rounded-md" />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Static Allocation per Stock (₹)</label>
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

        <div className="p-6 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-sm font-semibold">Cancel</button>
            <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold">Confirm & Deploy</button>
        </div>
      </div>
    </div>
  );
}
