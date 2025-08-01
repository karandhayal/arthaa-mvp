// In RuleBlock.tsx - The fully updated component

'use client';

type Rule = {
  id: number;
  indicator?: string;
  condition?: string;
  value?: string;
};

const indicatorOptions = ['RSI', 'MACD', 'Moving Average', 'Candle'];
const conditionOptionsMap: Record<string, string[]> = {
  RSI: ['Is Above', 'Is Below', 'Crosses Above', 'Crosses Below'],
  MACD: ['Crosses Above Signal', 'Crosses Below Signal', 'Is Positive', 'Is Negative'],
  'Moving Average': ['Crosses Above', 'Crosses Below', 'Is Above', 'Is Below'],
  Candle: ['Bullish Engulfing', 'Bearish Engulfing', 'Higher High', 'Lower Low'],
};

const valueOptionsMap: Record<string, string[]> = {
  RSI: ['30', '50', '70'],
  MACD: ['0', 'Signal Line'],
  'Moving Average': ['Moving Average(20)', 'Moving Average(50)', 'Price'],
  Candle: ['Previous Candle', 'Current Close'],
};

type RuleBlockProps = {
  rule: Rule;
  onDelete: () => void;
  onUpdate: (field: keyof Omit<Rule, 'id'>, value: string) => void;
};

export default function RuleBlock({ rule, onDelete, onUpdate }: RuleBlockProps) {
  const handleIndicatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndicator = e.target.value;
    onUpdate('indicator', newIndicator);
    // Reset condition and value when indicator changes
    onUpdate('condition', '');
    onUpdate('value', '');
  };

  return (
    <div className="bg-slate-700 rounded-xl p-4 flex flex-col gap-4 text-white shadow-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Trading Rule</h3>
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-500 transition-colors text-xl"
          title="Delete Rule"
        >
          ❌
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Indicator Dropdown */}
        <div className="flex flex-col flex-1">
          <label className="text-sm mb-1">Indicator</label>
          <select
            value={rule.indicator || ''} // Read from props
            onChange={handleIndicatorChange}
            className="bg-slate-800 p-2 rounded-md text-white outline-none"
          >
            <option value="" disabled>Select indicator</option>
            {indicatorOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Condition Dropdown */}
        <div className="flex flex-col flex-1">
          <label className="text-sm mb-1">Condition</label>
          <select
            value={rule.condition || ''} // Read from props
            onChange={(e) => onUpdate('condition', e.target.value)}
            className="bg-slate-800 p-2 rounded-md text-white outline-none"
            disabled={!rule.indicator} // Disable if no indicator is selected
          >
            <option value="" disabled>Select condition</option>
            {rule.indicator && conditionOptionsMap[rule.indicator]?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Value Dropdown/Input */}
        <div className="flex flex-col flex-1">
          <label className="text-sm mb-1">Value</label>
          <select
            value={rule.value || ''} // Read from props
            onChange={(e) => onUpdate('value', e.target.value)}
            className="bg-slate-800 p-2 rounded-md text-white outline-none"
            disabled={!rule.indicator} // Disable if no indicator is selected
          >
            <option value="" disabled>Select value</option>
            {rule.indicator && valueOptionsMap[rule.indicator]?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}