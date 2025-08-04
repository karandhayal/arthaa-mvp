'use client';

import { type StrategyFromDB } from './SavedStrategies';
import { type Rule, type RuleGroup } from './types';
import { FiX } from 'react-icons/fi';

type StrategySummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  strategy: StrategyFromDB | null;
};

// --- NEW, IMPROVED HELPER FUNCTIONS ---

// This function formats a single rule into a clear, human-readable string.
const formatRule = (rule: Rule): string => {
  let indicatorPart = rule.indicator || 'N/A';
  if (rule.period1) indicatorPart += `(${rule.period1}${rule.period2 ? `, ${rule.period2}` : ''})`;

  let conditionPart = rule.condition || '';

  let valuePart = '';
  if (rule.value_type === 'number') {
    valuePart = rule.value_number?.toString() || '';
  } else if (rule.value_type === 'indicator') {
    valuePart = `${rule.indicator}(${rule.value_period1 || ''})`;
  } else {
    valuePart = rule.value_indicator || '';
  }
  
  let offsetPart = '';
  if(rule.offset_value) {
      offsetPart = ` by ${rule.offset_value}${rule.offset_type === 'percentage' ? '%' : ''}`;
  }

  return `${indicatorPart} ${conditionPart} ${valuePart}${offsetPart}`;
};

// A new recursive component to render the logic in a clean, indented list.
const LogicRenderer = ({ group }: { group: RuleGroup }) => {
  if (!group || !Array.isArray(group.rules) || group.rules.length === 0) {
    return <p className="text-slate-400 text-sm">No conditions defined.</p>;
  }

  return (
    <div className="space-y-2">
      {group.rules.map((item, index) => (
        <div key={item.id}>
          {'logic' in item ? (
            <div className="bg-slate-700/50 p-3 rounded-lg">
              <LogicRenderer group={item as RuleGroup} />
            </div>
          ) : (
            <p className="text-slate-300 bg-slate-700/50 p-3 rounded-lg">{formatRule(item as Rule)}</p>
          )}

          {index < group.rules.length - 1 && (
            <div className="flex justify-center items-center my-2">
              <span className="text-xs font-bold text-sky-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                {group.logic}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};


export default function StrategySummaryModal({ isOpen, onClose, strategy }: StrategySummaryModalProps) {
  if (!isOpen || !strategy) return null;

  const { config } = strategy;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-lg w-full max-w-lg relative max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{strategy.name}</h2>
          <p className="text-sm text-slate-400">Strategy Summary</p>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Entry Logic */}
          <div>
            <h3 className="font-semibold text-emerald-400 mb-3 text-lg">Entry Conditions</h3>
            <LogicRenderer group={config.entryLogic} />
          </div>

          {/* Exit Logic */}
          <div>
            <h3 className="font-semibold text-red-400 mb-3 text-lg">Exit Conditions</h3>
            <LogicRenderer group={config.exitLogic} />
          </div>

          {/* Risk Management */}
          {(config.stopLoss > 0 || config.targetProfit > 0 || config.trailingStopLoss > 0) && (
            <div>
              <h3 className="font-semibold text-amber-400 mb-3 text-lg">Risk Management</h3>
              <div className="text-sm text-slate-300 space-y-2 bg-slate-700/50 p-3 rounded-lg">
                {config.stopLoss > 0 && <p><span className="font-medium text-slate-400">Stop Loss:</span> {config.stopLoss}%</p>}
                {config.targetProfit > 0 && <p><span className="font-medium text-slate-400">Target Profit:</span> {config.targetProfit}%</p>}
                {config.trailingStopLoss > 0 && <p><span className="font-medium text-slate-400">Trailing Stop Loss:</span> {config.trailingStopLoss}%</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
