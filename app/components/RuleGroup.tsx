'use client';

import RuleBlock from './RuleBlock';
import { type Rule, type RuleGroup as RuleGroupType } from './types';

type RuleGroupProps = {
  group: RuleGroupType;
  onUpdateGroup: (group: RuleGroupType) => void;
  onDelete: () => void;
  isRoot?: boolean;
};

export default function RuleGroup({ group, onUpdateGroup, onDelete, isRoot = false }: RuleGroupProps) {
  
  const handleUpdateItem = (updatedItem: Rule | RuleGroupType) => {
    const currentRules = Array.isArray(group.rules) ? group.rules : [];
    const newRules = currentRules.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    onUpdateGroup({ ...group, rules: newRules });
  };

  const handleAddItem = (itemType: 'rule' | 'group') => {
    let newItem: Rule | RuleGroupType;
    if (itemType === 'rule') {
      newItem = { id: Date.now() };
    } else {
      newItem = { id: Date.now(), logic: 'AND', rules: [] };
    }
    const currentRules = Array.isArray(group.rules) ? group.rules : [];
    onUpdateGroup({ ...group, rules: [...currentRules, newItem] });
  };

  const handleDeleteItem = (id: number) => {
    const currentRules = Array.isArray(group.rules) ? group.rules : [];
    const newRules = currentRules.filter(item => item.id !== id);
    onUpdateGroup({ ...group, rules: newRules });
  };

  const setLogic = (logic: 'AND' | 'OR') => {
    onUpdateGroup({ ...group, logic });
  };

  if (!group || !Array.isArray(group.rules)) {
    return <div className="text-red-500 p-4 border border-red-500 rounded-lg">Error: Invalid rule group data.</div>;
  }

  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">Logic for this group:</span>
          <div className="flex items-center bg-slate-700 rounded-full p-0.5">
            <button 
              onClick={() => setLogic('AND')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                group.logic === 'AND' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:bg-slate-600'
              }`}
            >
              AND
            </button>
            <button 
              onClick={() => setLogic('OR')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                group.logic === 'OR' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:bg-slate-600'
              }`}
            >
              OR
            </button>
          </div>
        </div>
        {!isRoot && (
           <button onClick={onDelete} className="text-slate-400 hover:text-red-500 text-xs">Delete Group</button>
        )}
      </div>

      {group.rules.map((item) => (
        <div key={item.id}>
          {('indicator' in item) || !('logic' in item) ? (
            <RuleBlock 
              rule={item as Rule} 
              onDelete={() => handleDeleteItem(item.id)}
              onUpdate={handleUpdateItem} // Pass the handler directly
            />
          ) : (
            <RuleGroup 
              group={item as RuleGroupType} 
              onDelete={() => handleDeleteItem(item.id)}
              onUpdateGroup={handleUpdateItem}
            />
          )}
        </div>
      ))}
      
      <div className="flex gap-2 pt-2 border-t border-slate-700">
        <button onClick={() => handleAddItem('rule')} className="text-sm bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded-md">+ Add Rule</button>
        <button onClick={() => handleAddItem('group')} className="text-sm bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-md">+ Add Group</button>
      </div>
    </div>
  );
}
