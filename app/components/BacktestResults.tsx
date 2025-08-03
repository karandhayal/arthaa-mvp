'use client';

// Define the shape of a single trade and the overall result
interface Trade {
  type: 'buy' | 'sell';
  price: number;
  date: string;
  size: number;
  reason?: string;
  pnl?: number; // Profit/Loss in currency
  pnl_percent?: number; // Profit/Loss in percentage
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

  if (!result || result.trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">{result ? 'No trades were executed.' : 'Run a backtest to see the results here.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-700 p-4 rounded-lg">
          <p className="text-sm text-slate-300">Final Portfolio</p>
          <p className="text-2xl font-bold">₹{result.finalPortfolio.toFixed(2)}</p>
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
      <h3 className="text-lg font-semibold mb-2">Trade Log</h3>
      <div className="flex-grow overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 sticky top-0">
            <tr>
              <th className="p-2 font-medium min-w-[90px]">Date</th>
              <th className="p-2 font-medium min-w-[60px]">Type</th>
              <th className="p-2 font-medium min-w-[80px]">Price</th>
              <th className="p-2 font-medium min-w-[60px]">Size</th>
              <th className="p-2 font-medium text-right min-w-[120px]">P/L</th>
              <th className="p-2 font-medium min-w-[250px]">Reason</th>
            </tr>
          </thead>
          <tbody>
            {result.trades.map((trade, index) => (
              <tr
                key={index}
                className={`border-b border-slate-700 ${
                  trade.type === 'buy' ? 'bg-slate-800/50' : trade.pnl! >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'
                }`}
              >
                <td className="p-2 align-top">{new Date(trade.date).toLocaleDateString()}</td>
                <td className={`p-2 font-bold align-top ${
                    trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}>{trade.type.toUpperCase()}</td>
                <td className="p-2 align-top">₹{trade.price.toFixed(2)}</td>
                <td className="p-2 align-top">{trade.size}</td>
                <td className="p-2 text-right font-mono align-top">
                  {trade.type === 'sell' && typeof trade.pnl === 'number' && (
                    <span className={trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(2)}
                      <span className="block text-xs text-slate-500">({trade.pnl_percent?.toFixed(2)}%)</span>
                    </span>
                  )}
                </td>
                <td className="p-2 text-slate-400 break-words align-top">{trade.reason || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
