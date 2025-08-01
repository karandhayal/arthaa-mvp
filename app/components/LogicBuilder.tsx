'use client';

import { useState } from 'react';
import RuleBlock from './RuleBlock';

// Define the Rule type here as well to use it in props
type Rule = {
  id: number;
  indicator?: string;
  condition?: string;
  value?: string;
  logic?: 'AND' | 'OR';
};

// MODIFICATION 1: Add onUpdateRule to the props
type LogicBuilderProps = {
  entryRules: Rule[]; // Changed from externalEntryRules for consistency
  exitRules: Rule[];  // Changed from externalExitRules for consistency
  onAddRule: (type: 'entry' | 'exit') => void;
  onDeleteRule: (type: 'entry' | 'exit', id: number) => void;
  onToggleLogic: (type: 'entry' | 'exit', index: number) => void;
  onUpdateRule: (type: 'entry' | 'exit', id: number, field: keyof Omit<Rule, 'id'>, value: string) => void; // <-- ADD THIS LINE
};

export default function LogicBuilder({
  entryRules,
  exitRules,
  onAddRule,
  onDeleteRule,
  onToggleLogic,
  onUpdateRule, // <-- ADD THIS LINE
}: LogicBuilderProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'exit'>('entry');
  
  // This internal state is no longer needed since the parent page now controls everything.
  // const [entryRules, setEntryRules] = useState<Rule[]>([{ id: Date.now() }]);
  // const [exitRules, setExitRules] = useState<Rule[]>([{ id: Date.now() + 1 }]);

  const rules = activeTab === 'entry' ? entryRules : exitRules;

  const handleAddRule = () => {
    onAddRule(activeTab);
  };

  const handleDeleteRule = (id: number) => {
    onDeleteRule(activeTab, id);
  };

  const handleToggleLogic = (index: number) => {
    onToggleLogic(activeTab, index);
  };

  return (
    <div className="bg-slate-800 text-white rounded-xl p-6 w-full shadow-md">
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
  <button
    onClick={() => setActiveTab('entry')}
    className={`flex-1 justify-center text-center px-4 py-2 rounded-md transition-colors ${
      activeTab === 'entry'
        ? 'bg-blue-600 text-white'
        : 'bg-slate-700 hover:bg-slate-600'
    }`}
  >
    Entry
  </button>
  <button
    onClick={() => setActiveTab('exit')}
    className={`flex-1 justify-center text-center px-4 py-2 rounded-md transition-colors ${
      activeTab === 'exit'
        ? 'bg-blue-600 text-white'
        : 'bg-slate-700 hover:bg-slate-600'
    }`}
  >
    Exit
  </button>
</div>

      {/* Rules List */}
      <div className="flex flex-col gap-4">
        {rules.map((rule, idx) => (
          <div key={rule.id}>
            {/* Logic Toggle Above (Not for first rule) */}
            {idx > 0 && (
              <div className="flex justify-center mb-2">
                <button
                  onClick={() => handleToggleLogic(idx)}
                  className="bg-slate-600 px-3 py-1 rounded-full text-sm hover:bg-slate-500 transition"
                >
                  {rule.logic || 'AND'}
                </button>
              </div>
            )}

            {/* MODIFICATION 2: This is where you replace the old RuleBlock with the new one */}
            <RuleBlock
              rule={rule}
              onDelete={() => handleDeleteRule(rule.id)}
              onUpdate={(field, value) => {
                // The onUpdateRule function from the parent (page.tsx) is called here
                onUpdateRule(activeTab, rule.id, field, value);
              }}
            />
          </div>
        ))}

        {/* Add New Rule Button */}
        <button
          onClick={handleAddRule}
          className="mt-4 self-start px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md"
        >
          Add New Rule
        </button>
      </div>
    </div>
  );
}