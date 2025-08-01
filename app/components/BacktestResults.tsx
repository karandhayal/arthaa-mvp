'use client';

// Define the shape of a single trade and the overall result
interface Trade {
  type: 'buy' | 'sell';
  price: number;
  date: string;
  size: number;
}

export interface BacktestResult {
  trades: Trade[];
  finalPortfolio: number;
  performance: number;
  winRate: number;
  totalTrades: number;
}

type BacktestResultsProps = {
  result: BacktestResult | null;
  loading: boolean;
};

export default function BacktestResults({ result, loading }: BacktestResultsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg">Running backtest...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">Run a backtest to see the results here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700 p-4 rounded-lg">
          <p className="text-sm text-slate-300">Final Portfolio</p>
          <p className="text-2xl font-bold">${result.finalPortfolio.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg">
          <p className="text-sm text-slate-300">Net Performance</p>
          <p
            className={`text-2xl font-bold ${
              result.performance >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {result.performance.toFixed(2)}%
          </p>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg">
          <p className="text-sm text-slate-300">Total Trades</p>
          <p className="text-2xl font-bold">{result.totalTrades}</p>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg">
          <p className="text-sm text-slate-300">Win Rate</p>
          <p className="text-2xl font-bold">{result.winRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Trade Log */}
      <div className="flex-grow overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">Trade Log</h3>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900">
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Type</th>
              <th className="p-2">Price</th>
              <th className="p-2">Size</th>
            </tr>
          </thead>
          <tbody>
            {result.trades.map((trade, index) => (
              <tr
                key={index}
                className={`border-b border-slate-700 ${
                  trade.type === 'buy' ? 'bg-green-900/20' : 'bg-red-900/20'
                }`}
              >
                <td className="p-2">{new Date(trade.date).toLocaleDateString()}</td>
                <td className={`p-2 font-bold ${
                    trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}>{trade.type.toUpperCase()}</td>
                <td className="p-2">${trade.price.toFixed(2)}</td>
                <td className="p-2">{trade.size.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}