'use client';

import { useState } from 'react';
import { type Rule } from './types'; // Import the shared Rule type

const indicatorOptions = ['RSI', 'MACD', 'Moving Average', 'EMA', 'Bollinger Bands', 'Candle'];

const conditionOptionsMap: Record<string, string[]> = {
  RSI: ['Is Above', 'Is Below', 'Crosses Above', 'Crosses Below'],
  MACD: ['Crosses Above Signal', 'Crosses Below Signal', 'Is Positive', 'Is Negative'],
  'Moving Average': ['Crosses Above', 'Crosses Below', 'Is Above', 'Is Below'],
  'EMA': ['Crosses Above', 'Crosses Below', 'Is Above', 'Is Below'],
  'Bollinger Bands': ['Price is Above', 'Price is Below', 'Price Crosses Above', 'Price Crosses Below'],
  Candle: ['Bullish Engulfing', 'Bearish Engulfing', 'Higher High', 'Lower Low'],
};

const valueOptionsMap: Record<string, string[]> = {
  RSI: ['30', '50', '70'],
  MACD: ['0', 'Signal Line'],
  'Moving Average': ['Moving Average(20)', 'Moving Average(50)', 'Price'],
  'EMA': ['EMA(12)', 'EMA(26)', 'Price'],
  'Bollinger Bands': ['Upper Band', 'Lower Band', 'Middle Band'],
  Candle: ['Previous Candle', 'Current Close'],
};

type RuleBlockProps = {
  rule: Rule;
  onDelete: () => void;
  onUpdate: (updatedRule: Rule) => void; // Prop now expects the full rule object
};

export default function RuleBlock({ rule, onDelete, onUpdate }: RuleBlockProps) {
  
  const [useOffset, setUseOffset] = useState(!!rule.offset_value);

  const handleIndicatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndicator = e.target.value;
    // Create a new rule object with all changes and call onUpdate once
    onUpdate({
      ...rule,
      indicator: newIndicator,
      condition: '', // Reset dependent fields
      value: '',
      offset_type: undefined,
      offset_value: undefined,
    });
    setUseOffset(false);
  };

  const canHaveOffset = rule.condition?.toLowerCase().includes('cross');

  return (
    <div className="bg-slate-700 rounded-xl p-4 flex flex-col gap-4 text-white shadow-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Rule</h3>
        <button onClick={onDelete} className="text-red-400 hover:text-red-500 transition-colors text-xl" title="Delete Rule">
          ❌
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select value={rule.indicator || ''} onChange={handleIndicatorChange} className="bg-slate-800 p-2 rounded-md">
            <option value="" disabled>Indicator</option>
            {indicatorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={rule.condition || ''} onChange={(e) => onUpdate({ ...rule, condition: e.target.value })} className="bg-slate-800 p-2 rounded-md" disabled={!rule.indicator}>
            <option value="" disabled>Condition</option>
            {rule.indicator && conditionOptionsMap[rule.indicator]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={rule.value || ''} onChange={(e) => onUpdate({ ...rule, value: e.target.value })} className="bg-slate-800 p-2 rounded-md" disabled={!rule.indicator}>
            <option value="" disabled>Value</option>
            {rule.indicator && valueOptionsMap[rule.indicator]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      {canHaveOffset && (
        <div className="mt-2 p-3 bg-slate-600/50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded" checked={useOffset} onChange={() => setUseOffset(!useOffset)} />
                <span className="text-sm">Add offset (e.g., crosses by 0.5%)</span>
            </label>
            {useOffset && (
                <div className="mt-3 flex items-center gap-2">
                    <input 
                        type="number" 
                        placeholder="0.5" 
                        className="bg-slate-800 p-2 rounded-md w-1/2"
                        value={rule.offset_value || ''}
                        onChange={(e) => onUpdate({ ...rule, offset_value: Number(e.target.value) })}
                    />
                    <select 
                        className="bg-slate-800 p-2 rounded-md w-1/2"
                        value={rule.offset_type || 'percentage'}
                        onChange={(e) => onUpdate({ ...rule, offset_type: e.target.value as 'percentage' | 'value' })}
                    >
                        <option value="percentage">%</option>
                        <option value="value">Value</option>
                    </select>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
