'use client';

import type { Session } from '@supabase/auth-helpers-nextjs';

// Define the shape of the strategy data it receives
type Strategy = {
  strategyName: string;
  stopLoss: number;
  targetProfit: number;
};

// --- THIS IS THE FIX ---
// Add session and onLogout to the props definition
type SummaryPanelProps = {
  strategy: Strategy;
  onChange: (field: keyof Strategy, value: string | number) => void;
  onSave: () => void;
  session: Session | null;
  onLogout: () => void;
};

export default function SummaryPanel({
  strategy,
  onChange,
  onSave,
  session,
  onLogout
}: SummaryPanelProps) {
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
      <div className="flex flex-col">
        <label className="text-sm mb-1">Stop Loss (%)</label>
        <input
          type="number"
          value={strategy.stopLoss}
          onChange={(e) => onChange('stopLoss', Number(e.target.value))}
          placeholder="e.g. 5"
          className="bg-slate-700 p-2 rounded-md text-white outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm mb-1">Target Profit (%)</label>
        <input
          type="number"
          value={strategy.targetProfit}
          onChange={(e) => onChange('targetProfit', Number(e.target.value))}
          placeholder="e.g. 10"
          className="bg-slate-700 p-2 rounded-md text-white outline-none"
        />
      </div>
      
      <div className="mt-auto flex flex-col gap-4">
        {/* This logic will now work correctly */}
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