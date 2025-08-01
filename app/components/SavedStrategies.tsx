'use client';

// Define a more specific type for the strategy configuration
interface StrategyConfig {
  entryConditions: object[]; // Using object as a placeholder for the rule structure
  exitConditions: object[];
  stopLoss: number;
  targetProfit: number;
}

export type StrategyFromDB = {
  id: string;
  name: string;
  config: StrategyConfig;
  created_at: string;
};

type SavedStrategiesProps = {
  strategies: StrategyFromDB[];
  onLoad: (strategy: StrategyFromDB) => void;
  onDelete: (id: string) => void;
};

export default function SavedStrategies({ strategies, onLoad, onDelete }: SavedStrategiesProps) {
  if (strategies.length === 0) {
    return (
      <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md h-full">
        <h2 className="text-xl font-semibold mb-4">My Saved Strategies</h2>
        <p className="text-slate-400">You have not saved any strategies yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-md h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4">My Saved Strategies</h2>
      <ul className="space-y-3 overflow-y-auto">
        {strategies.map((strategy) => (
          <li
            key={strategy.id}
            className="bg-slate-700 p-3 rounded-lg flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{strategy.name}</p>
              <p className="text-xs text-slate-400">
                Saved: {new Date(strategy.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onLoad(strategy)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
              >
                Load
              </button>
              <button
                onClick={() => onDelete(strategy.id)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}