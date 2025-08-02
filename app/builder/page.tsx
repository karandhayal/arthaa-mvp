'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/auth-helpers-nextjs';

import Header from './components/Header'; // <-- IMPORT HEADER
import LogicBuilder from './components/LogicBuilder';
import SummaryPanel from './components/SummaryPannel';
import LoginModal from './components/LoginModal';
import SavedStrategies, { type StrategyFromDB } from './components/SavedStrategies';
import './globals.css';

// Type definitions remain the same
type Rule = { id: number; indicator?: string; condition?: string; value?: string; logic?: 'AND' | 'OR'; };
type Strategy = { strategyName: string; entryConditions: Rule[]; exitConditions: Rule[]; stopLoss: number; targetProfit: number; };

export default function Home() {
  // All state and functions remain the same
  const [strategy, setStrategy] = useState<Strategy>({ strategyName: '', entryConditions: [], exitConditions: [], stopLoss: 0, targetProfit: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<StrategyFromDB[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // ... useEffect content remains exactly the same
    const getSessionAndStrategies = async (currentSession: Session | null) => {
      setSession(currentSession);
      if (currentSession) {
        const { data, error } = await supabase.from('strategies').select('*').eq('user_id', currentSession.user.id).order('created_at', { ascending: false });
        if (error) { console.error('Error fetching strategies:', error); } else { setSavedStrategies(data); }
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => { getSessionAndStrategies(session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      getSessionAndStrategies(session);
      if (session) setIsModalOpen(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase, supabase.auth]);
  
  // All other functions (loadStrategy, deleteStrategy, handleSave, etc.) remain the same
  const loadStrategy = (strategyToLoad: StrategyFromDB) => { setStrategy({ strategyName: strategyToLoad.name, entryConditions: strategyToLoad.config.entryConditions || [], exitConditions: strategyToLoad.config.exitConditions || [], stopLoss: strategyToLoad.config.stopLoss || 0, targetProfit: strategyToLoad.config.targetProfit || 0, }); alert(`Strategy "${strategyToLoad.name}" loaded!`); };
  const deleteStrategy = async (id: string) => { if (!confirm('Are you sure you want to delete this strategy?')) return; const { error } = await supabase.from('strategies').delete().eq('id', id); if (error) { alert('Error deleting strategy: ' + error.message); } else { setSavedStrategies(savedStrategies.filter((s) => s.id !== id)); alert('Strategy deleted successfully!'); } };
  const handleSave = async () => { if (!session) { setIsModalOpen(true); return; } if (!strategy.strategyName) { alert('Please enter a name for your strategy.'); return; } const { entryConditions, exitConditions, stopLoss, targetProfit } = strategy; const strategyConfig = { entryConditions, exitConditions, stopLoss, targetProfit }; const { data, error } = await supabase.from('strategies').insert({ name: strategy.strategyName, config: strategyConfig, user_id: session.user.id, }).select().single(); if (error) { alert('Error saving strategy: ' + error.message); } else { setSavedStrategies([data, ...savedStrategies]); alert('Strategy saved successfully!'); } };
  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); setSavedStrategies([]); };
  const updateField = (field: keyof Omit<Strategy, 'entryConditions' | 'exitConditions'>, value: string | number) => { setStrategy((prev) => ({ ...prev, [field]: value })); };
  const addRule = (type: 'entry' | 'exit') => { const newRule: Rule = { id: Date.now(), logic: 'AND' }; const key = type === 'entry' ? 'entryConditions' : 'exitConditions'; setStrategy((prev) => ({ ...prev, [key]: [...prev[key], newRule] })); };
  const deleteRule = (type: 'entry' | 'exit', id: number) => { const key = type === 'entry' ? 'entryConditions' : 'exitConditions'; setStrategy((prev) => ({ ...prev, [key]: prev[key].filter((r) => r.id !== id) })); };
  const updateRule = (type: 'entry' | 'exit', id: number, field: keyof Rule, value: string) => { const key = type === 'entry' ? 'entryConditions' : 'exitConditions'; setStrategy((prev) => ({...prev, [key]: prev[key].map((r) => (r.id === id ? { ...r, [field]: value } : r)), })); };
  const toggleLogic = (type: 'entry' | 'exit', index: number) => { const key = type === 'entry' ? 'entryConditions' : 'exitConditions'; const rules = [...strategy[key]]; if (rules[index]) { rules[index].logic = rules[index].logic === 'AND' ? 'OR' : 'AND'; setStrategy(prev => ({ ...prev, [key]: rules })); } };

  return (
    <>
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    
      {/* This is the new structure */}
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        <Header session={session} onLoginClick={() => setIsModalOpen(true)} />

        <main className="flex flex-col md:flex-row flex-grow p-4 gap-4">
          {/* Left Panel */}
          <section className="w-full md:w-[25%] bg-slate-800 rounded-xl">
            {session ? (
              <SavedStrategies strategies={savedStrategies} onLoad={loadStrategy} onDelete={deleteStrategy} />
            ) : (
              <div className="p-6">
                <h2 className="text-xl font-semibold">My Strategies</h2>
                <p className="text-slate-400 mt-4">Please log in to see your saved strategies.</p>
              </div>
            )}
          </section>

          {/* Center Panel */}
          <section className="w-full md:w-[50%] flex flex-col gap-4">
            {/* Chart and Logic Builder here... */}
            <div className="h-[40%] bg-slate-700 rounded-xl p-4 flex flex-col">
              <h2 className="text-lg font-semibold mb-2">Chart</h2>
              <div className="flex-grow h-full flex items-center justify-center text-slate-300">Chart Placeholder</div>
            </div>
            <div className="h-[60%] bg-slate-700 rounded-xl p-4 flex flex-col">
              <h2 className="text-lg font-semibold mb-2">Logic Builder</h2>
              <div className="overflow-auto flex-grow">
                <LogicBuilder entryRules={strategy.entryConditions} exitRules={strategy.exitConditions} onAddRule={addRule} onDeleteRule={deleteRule} onToggleLogic={toggleLogic} onUpdateRule={updateRule} />
              </div>
            </div>
          </section>

          {/* Right Panel */}
          <section className="w-full md:w-[25%] bg-slate-800 rounded-xl">
            <SummaryPanel strategy={{ strategyName: strategy.strategyName, stopLoss: strategy.stopLoss, targetProfit: strategy.targetProfit, }} onChange={updateField} onSave={handleSave} session={session} onLogout={handleLogout} />
          </section>
        </main>
      </div>
    </>
  );
}