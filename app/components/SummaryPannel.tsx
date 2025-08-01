'use client';

type Strategy = {
  strategyName: string;
  stopLoss: number;
  targetProfit: number;
};

type SummaryPanelProps = {
  strategy: Strategy;
  onChange: (field: keyof Strategy, value: string | number) => void;
  onSave: () => void;
};

export default function SummaryPanel({
  strategy,
  onChange,
  onSave,
}: SummaryPanelProps) {
  return (
    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md flex flex-col gap-6 h-full">
      <h2 className="text-xl font-semibold">Strategy Summary</h2>

      {/* Strategy Name */}
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

      {/* Stop Loss */}
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

      {/* Target Profit */}
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

      {/* Save Button */}
      <button
        onClick={onSave}
        className="mt-auto bg-gradient-to-r from-green-500 to-green-700 text-white py-2 px-4 rounded-md hover:opacity-90 transition"
      >
        Save Strategy
      </button>
    </div>
  );
}
