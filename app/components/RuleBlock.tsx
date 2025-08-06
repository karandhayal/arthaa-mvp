'use client';

import { useState, useEffect } from 'react';
import { type Rule } from './types';
import { FiSettings } from 'react-icons/fi';

// Types for Indicator Config
type IndicatorParam = {
  name: string;
  key: keyof Rule;
  default: number;
};

type IndicatorValue = {
  type: 'number' | 'static' | 'indicator';
  label: string;
};

type IndicatorConfig = {
  params: IndicatorParam[];
  conditions: string[];
  values: IndicatorValue[];
};

const INDICATOR_CONFIG: Record<string, IndicatorConfig> = {
  RSI: {
    params: [{ name: 'Period', key: 'period1', default: 14 }],
    conditions: ['Is Above', 'Is Below', 'Crosses Above', 'Crosses Below'],
    values: [{ type: 'number', label: 'Number' }],
  },
  MACD: {
    params: [
      { name: 'Fast', key: 'period1', default: 12 },
      { name: 'Slow', key: 'period2', default: 26 },
    ],
    conditions: ['Crosses Above Signal', 'Crosses Below Signal'],
    values: [],
  },
  'Moving Average': {
    params: [{ name: 'Period', key: 'period1', default: 20 }],
    conditions: ['Crosses Above', 'Crosses Below', 'Is Above', 'Is Below'],
    values: [
      { type: 'static', label: 'Price' },
      { type: 'indicator', label: 'Another MA' },
    ],
  },
  EMA: {
    params: [{ name: 'Period', key: 'period1', default: 12 }],
    conditions: ['Crosses Above', 'Crosses Below', 'Is Above', 'Is Below'],
    values: [
      { type: 'static', label: 'Price' },
      { type: 'indicator', label: 'Another EMA' },
    ],
  },
  'Bollinger Bands': {
    params: [{ name: 'Period', key: 'period1', default: 20 }],
    conditions: ['Price Crosses Above', 'Price Crosses Below'],
    values: [
      { type: 'static', label: 'Upper Band' },
      { type: 'static', label: 'Lower Band' },
    ],
  },
  Candle: {
    params: [],
    conditions: ['Higher High', 'Lower Low'],
    values: [],
  },
};

// Props
type RuleBlockProps = {
  rule: Rule;
  onDelete: () => void;
  onUpdate: (updatedRule: Rule) => void;
};

export default function RuleBlock({ rule, onDelete, onUpdate }: RuleBlockProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [useOffset, setUseOffset] = useState(!!rule.offset_value);
  const config = rule.indicator ? INDICATOR_CONFIG[rule.indicator] : null;

  useEffect(() => {
    setUseOffset(!!rule.offset_value);
  }, [rule.offset_value]);

  const handleIndicatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newIndicator = e.target.value as keyof typeof INDICATOR_CONFIG;
    const newConfig = INDICATOR_CONFIG[newIndicator];
    const newRule: Rule = {
      id: rule.id,
      indicator: newIndicator,
      period1: newConfig.params.find((p) => p.key === 'period1')?.default,
      period2: newConfig.params.find((p) => p.key === 'period2')?.default,
      value_type: newConfig.values[0]?.type,
      value_indicator: newConfig.values[0]?.label,
      offset_type: undefined,
      offset_value: undefined,
    };
    onUpdate(newRule);
    setUseOffset(false);
  };

  const updateParam = (key: keyof Rule, value: string) => {
    onUpdate({ ...rule, [key]: Number(value) });
  };

  const canHaveOffset = rule.condition?.toLowerCase().includes('cross');

  return (
    <div className="bg-slate-700 rounded-xl p-4 flex flex-col gap-4 text-white shadow-md">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
        <select
          value={rule.indicator || ''}
          onChange={handleIndicatorChange}
          className="bg-slate-800 p-2 rounded-md font-semibold w-full"
        >
          <option value="" disabled>
            Select Indicator
          </option>
          {Object.keys(INDICATOR_CONFIG).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {config && config.params.length > 0 && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-md transition-colors ${
              showSettings
                ? 'bg-emerald-500'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
          >
            <FiSettings />
          </button>
        )}
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-500 transition-colors text-xl p-2"
          title="Delete Rule"
        >
          ❌
        </button>
      </div>

      {showSettings && config && config.params.length > 0 && (
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-600/50 rounded-md">
          {config.params.map((param) => (
            <div key={param.key}>
              <label className="text-xs text-slate-400">{param.name}</label>
              <input
                type="number"
                value={(rule[param.key] as number) || ''}
                onChange={(e) => updateParam(param.key, e.target.value)}
                className="w-full bg-slate-800 p-1 rounded-md text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {rule.indicator && (
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          <select
            value={rule.condition || ''}
            onChange={(e) =>
              onUpdate({ ...rule, condition: e.target.value })
            }
            className="bg-slate-800 p-2 rounded-md w-full md:w-1/2"
          >
            <option value="" disabled>
              Select Condition
            </option>
            {config?.conditions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {config && config.values.length > 0 && (
            <div className="w-full md:w-1/2">
              <ValueInput rule={rule} onUpdate={onUpdate} config={config} />
            </div>
          )}
        </div>
      )}

      {canHaveOffset && (
        <div className="mt-2 p-3 bg-slate-600/50 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500"
              checked={useOffset}
              onChange={() => setUseOffset(!useOffset)}
            />
            <span className="text-sm">
              Add offset (e.g., crosses by 0.5%)
            </span>
          </label>

          {useOffset && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                placeholder="0.5"
                className="bg-slate-800 p-2 rounded-md w-1/2"
                value={rule.offset_value || ''}
                onChange={(e) =>
                  onUpdate({
                    ...rule,
                    offset_value: Number(e.target.value),
                  })
                }
              />
              <select
                className="bg-slate-800 p-2 rounded-md w-1/2"
                value={rule.offset_type || 'percentage'}
                onChange={(e) =>
                  onUpdate({
                    ...rule,
                    offset_type: e.target.value as 'percentage' | 'value',
                  })
                }
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

function ValueInput({
  rule,
  onUpdate,
  config,
}: {
  rule: Rule;
  onUpdate: (rule: Rule) => void;
  config: IndicatorConfig;
}) {
  const valueType = rule.value_type || config.values[0]?.type;

  return (
    <div className="flex flex-col gap-2 h-full">
      {config.values.length > 1 && (
        <div className="flex items-center bg-slate-800 rounded-md p-1 w-full">
          {config.values.map((val) => {
            const isActive =
              val.type === 'static'
                ? rule.value_indicator === val.label
                : valueType === val.type;

            return (
              <button
                key={val.label}
                onClick={() =>
                  onUpdate({
                    ...rule,
                    value_type: val.type,
                    value_indicator: val.label,
                  })
                }
                className={`flex-1 text-xs px-2 py-1 rounded ${
                  isActive ? 'bg-emerald-500' : 'hover:bg-slate-700'
                }`}
              >
                {val.label}
              </button>
            );
          })}
        </div>
      )}

      {valueType === 'number' && (
        <input
          type="number"
          placeholder="Value"
          value={rule.value_number || ''}
          onChange={(e) =>
            onUpdate({ ...rule, value_number: Number(e.target.value) })
          }
          className="bg-slate-800 p-2 rounded-md w-full"
        />
      )}

      {valueType === 'indicator' && (
        <div className="flex items-center gap-2 w-full bg-slate-800 p-2 rounded-md">
          <span className="text-sm">{rule.indicator}(</span>
          <input
            type="number"
            placeholder="Period"
            value={rule.value_period1 || ''}
            onChange={(e) =>
              onUpdate({ ...rule, value_period1: Number(e.target.value) })
            }
            className="bg-slate-900 p-1 rounded-md w-full text-center"
          />
          <span className="text-sm">)</span>
        </div>
      )}
    </div>
  );
}
