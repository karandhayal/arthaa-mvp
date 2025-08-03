'use client';

import { useState } from 'react';
import RuleGroup from './RuleGroup';
import { type RuleGroup as RuleGroupType } from './types';

type LogicBuilderProps = {
  entryLogic: RuleGroupType;
  exitLogic: RuleGroupType;
  onUpdateEntryLogic: (logic: RuleGroupType) => void;
  onUpdateExitLogic: (logic: RuleGroupType) => void;
};

export default function LogicBuilder({
  entryLogic,
  exitLogic,
  onUpdateEntryLogic,
  onUpdateExitLogic,
}: LogicBuilderProps) {
  const [activeTab, setActiveTab] = useState<'entry' | 'exit'>('entry');

  const activeLogic = activeTab === 'entry' ? entryLogic : exitLogic;
  const updateActiveLogic = activeTab === 'entry' ? onUpdateEntryLogic : onUpdateExitLogic;

  return (
    <div className="bg-slate-800 text-white rounded-xl p-6 w-full shadow-md">
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('entry')} className={`px-4 py-2 rounded-md ${activeTab === 'entry' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          Entry Conditions
        </button>
        <button onClick={() => setActiveTab('exit')} className={`px-4 py-2 rounded-md ${activeTab === 'exit' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
          Exit Conditions
        </button>
      </div>

      {/* Main Rule Group */}
      <RuleGroup 
        group={activeLogic}
        onUpdateGroup={updateActiveLogic}
        onDelete={() => { /* This won't be called for the root group */ }}
        isRoot={true}
      />
    </div>
  );
}
