'use client';

import { useState } from 'react';
// Define the shape of the strategy data it receives
type Strategy = {
  strategyName: string;
  stopLoss: number;
  targetProfit: number;
  trailingStopLoss: number; // New field
};

// Define the props for the component
type SummaryPanelProps = {
  strategy: Strategy;
  onChange: (field: keyof Strategy, value: string | number) => void;
  onSave: () => void;
  session: Session | null;
  onLogout: () => void;
};

// A reusable toggle switch component
function Toggle({ label, enabled, setEnabled }: { label: string, enabled: boolean, setEnabled: (enabled: boolean) => void }) {
    return (
        <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold">{label}</span>
            <div className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <input type="checkbox" className="hidden" checked={enabled} onChange={() => setEnabled(!enabled)} />
        </label>
    );
}


export default function SummaryPanel({
  strategy,
  onChange,
  onSave,
  session,
  onLogout
}: SummaryPanelProps) {
  // State to manage if the features are enabled
  const [slEnabled, setSlEnabled] = useState(false);
  const [tpEnabled, setTpEnabled] = useState(false);
  const [tslEnabled, setTslEnabled] = useState(false);

  return (
    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md flex flex-col gap-6 h-full">
      <h2 className="text-xl font-semibold">Strategy Summary</h2>

      <div className="flex flex-col">
        <label className="text-sm mb-1">Strategy Name</label>
        <input
          type="text"
          value={strategy.strategyName}
          onChange={(e) => onChange('strategyName', e.target.value)}
          placeholder="Enter strategy name"
          className="bg-slate-700 p-2 rounded-md text-white outline-none"
        />
      </div>
      
      <div className="space-y-4">
        <Toggle label="Stop Loss" enabled={slEnabled} setEnabled={setSlEnabled} />
        {slEnabled && (
            <div className="pl-4">
                <label className="text-sm mb-1 block">Stop Loss (%)</label>
                <input
                    type="number"
                    value={strategy.stopLoss}
                    onChange={(e) => onChange('stopLoss', Number(e.target.value))}
                    placeholder="e.g. 5"
                    className="w-full bg-slate-700 p-2 rounded-md text-white outline-none"
                />
            </div>
        )}

        <Toggle label="Target Profit" enabled={tpEnabled} setEnabled={setTpEnabled} />
        {tpEnabled && (
            <div className="pl-4">
                <label className="text-sm mb-1 block">Target Profit (%)</label>
                <input
                    type="number"
                    value={strategy.targetProfit}
                    onChange={(e) => onChange('targetProfit', Number(e.target.value))}
                    placeholder="e.g. 10"
                    className="w-full bg-slate-700 p-2 rounded-md text-white outline-none"
                />
            </div>
        )}

        <Toggle label="Trailing Stop Loss" enabled={tslEnabled} setEnabled={setTslEnabled} />
        {tslEnabled && (
            <div className="pl-4">
                <label className="text-sm mb-1 block">Trailing Stop Loss (%)</label>
                <input
                    type="number"
                    value={strategy.trailingStopLoss}
                    onChange={(e) => onChange('trailingStopLoss', Number(e.target.value))}
                    placeholder="e.g. 2"
                    className="w-full bg-slate-700 p-2 rounded-md text-white outline-none"
                />
            </div>
        )}
      </div>
      
      <div className="mt-auto flex flex-col gap-4">
        {session ? (
            <div className='text-center text-sm'>
              <p>Logged in as: {session.user.email}</p>
              <button
                onClick={onLogout}
                className="mt-2 w-full text-center py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
        ) : null}

        <button
          onClick={onSave}
          className="w-full text-center py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all"
        >
          Save Strategy
        </button>
      </div>
    </div>
  );
}
