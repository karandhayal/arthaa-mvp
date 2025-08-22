'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

// Define types for our option chain data
type OptionContract = {
    symbol: string;
    ltp: number;
    oi: number;
};

type OptionChainRow = {
    strikePrice: number;
    expiryDate: string;
    call: OptionContract;
    put: OptionContract;
};

type OptionSelectorProps = {
  onSelectContract: (symbol: string) => void;
};

export default function OptionSelector({ onSelectContract }: OptionSelectorProps) {
  const [underlying, setUnderlying] = useState('NIFTY');
  const [loading, setLoading] = useState(false);
  const [optionChain, setOptionChain] = useState<OptionChainRow[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const handleFetchChain = async () => {
    setLoading(true);
    setOptionChain([]);
    try {
      const response = await fetch('/api/angelone/option-chain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: underlying }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch option chain.');
      setOptionChain(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (symbol: string) => {
      setSelectedSymbol(symbol);
      onSelectContract(symbol);
  };

  return (
    <div className="bg-slate-700/50 p-4 rounded-lg space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={underlying}
          onChange={(e) => setUnderlying(e.target.value.toUpperCase())}
          className="w-full bg-slate-800 p-2 rounded-md"
          placeholder="e.g., NIFTY, INFY"
        />
        <button onClick={handleFetchChain} disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold disabled:bg-slate-500">
          {loading ? '...' : 'Get Chain'}
        </button>
      </div>

      {selectedSymbol && <p className="text-sm text-center font-bold text-emerald-400">Selected: {selectedSymbol}</p>}

      {optionChain.length > 0 && (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-xs text-center">
            <thead className="sticky top-0 bg-slate-800">
              <tr>
                <th className="p-2 font-semibold text-red-400">CALL LTP</th>
                <th className="p-2 font-semibold bg-slate-900">STRIKE</th>
                <th className="p-2 font-semibold text-green-400">PUT LTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {optionChain.map(row => (
                <tr key={row.strikePrice}>
                  <td onClick={() => handleSelect(row.call.symbol)} className="p-2 hover:bg-red-500/20 cursor-pointer">{row.call.ltp.toFixed(2)}</td>
                  <td className="p-2 font-bold bg-slate-900">{row.strikePrice}</td>
                  <td onClick={() => handleSelect(row.put.symbol)} className="p-2 hover:bg-green-500/20 cursor-pointer">{row.put.ltp.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
