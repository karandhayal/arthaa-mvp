'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/ssr'; // <-- CHANGED
import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import LoginModal from '../components/LoginModal';
import DeployModal, { type AllocationConfig } from '../components/DeployModal';
import { type StrategyFromDB } from '../components/SavedStrategies';
import LiveTradeLog from '../components/LiveTradeLog';
import { FiPlayCircle, FiLogIn, FiStopCircle } from 'react-icons/fi';

type LiveStrategy = {
  id: string;
  status: string;
  allocation_config: AllocationConfig;
  strategies: StrategyFromDB; 
};

export default function LivePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [strategyToDeploy, setStrategyToDeploy] = useState<StrategyFromDB | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<StrategyFromDB[]>([]);
  const [liveStrategies, setLiveStrategies] = useState<LiveStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [brokerConfig, setBrokerConfig] = useState<Record<string, unknown> | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getSessionAndData = async (currentSession: Session | null) => {
      setSession(currentSession);
      if (currentSession) {
        const { data: strategiesData } = await supabase.from('strategies').select('*').eq('user_id', currentSession.user.id);
        if (strategiesData) setSavedStrategies(strategiesData as StrategyFromDB[]);
        const { data: liveData } = await supabase.from('live_strategies').select('*, strategies(*)').eq('user_id', currentSession.user.id);
        if (liveData) setLiveStrategies(liveData as LiveStrategy[]);
        const { data: config } = await supabase.from('broker_config').select('id').eq('user_id', currentSession.user.id).single();
        setBrokerConfig(config);
      }
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      getSessionAndData(currentSession);
    });
  }, [supabase]);

  const openDeployModal = (strategy: StrategyFromDB) => {
    if (!brokerConfig) {
      alert('Please connect your broker account on the Account page before deploying a strategy.');
      router.push('/account');
      return;
    }
    setStrategyToDeploy(strategy);
    setIsDeployModalOpen(true);
  };

  const handleConfirmDeploy = async (config: AllocationConfig) => {
    if (!strategyToDeploy || !session) return;
    const { data, error } = await supabase
      .from('live_strategies')
      .insert({ user_id: session.user.id, strategy_id: strategyToDeploy.id, timeframe: '1day', status: 'active', allocation_config: config })
      .select('*, strategies(*)').single();
    if (error) {
      alert('Error deploying strategy: ' + error.message);
    } else if (data) {
      setLiveStrategies([...liveStrategies, data as LiveStrategy]);
      alert(`Strategy "${strategyToDeploy.name}" has been deployed successfully!`);
    }
    setIsDeployModalOpen(false);
    setStrategyToDeploy(null);
  };

  const handleStopStrategy = async (liveStrategyId: string) => {
    if (!confirm('Are you sure you want to stop this live strategy?')) return;
    const { data, error } = await supabase
      .from('live_strategies')
      .update({ status: 'inactive', stopped_at: new Date().toISOString() })
      .eq('id', liveStrategyId).select('*, strategies(*)').single();
    if (error) {
      alert('Error stopping strategy: ' + error.message);
    } else if (data) {
      setLiveStrategies(liveStrategies.map(ls => ls.id === liveStrategyId ? (data as LiveStrategy) : ls));
      alert('Strategy stopped successfully.');
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-slate-900 text-white">Loading...</div>;

  const activeStrategies = liveStrategies.filter(s => s.status === 'active');
  const availableStrategies = savedStrategies.filter(ss => !liveStrategies.some(ls => ls.strategies.id === ss.id && ls.status === 'active'));

  return (
    <>
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <DeployModal isOpen={isDeployModalOpen} onClose={() => setIsDeployModalOpen(false)} strategy={strategyToDeploy} onConfirmDeploy={handleConfirmDeploy} />
      <div className="min-h-screen bg-slate-900 text-white flex flex-col">
        <Header session={session} onLoginClick={() => setIsModalOpen(true)} />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col gap-6">
             {!session ? (
                 <div className="text-center py-20 bg-slate-800/50 rounded-xl flex-grow flex flex-col justify-center"><FiLogIn className="mx-auto text-5xl text-slate-500 mb-4" /><h3 className="font-bold text-xl">Please Log In</h3><p className="text-slate-400 text-sm mt-2 mb-6">You need to be logged in to manage live strategies.</p><button onClick={() => setIsModalOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2 rounded-lg self-center">Login / Sign Up</button></div>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Active Strategies</h2>
                    {activeStrategies.length > 0 ? (
                        <div className="space-y-4">
                            {activeStrategies.map(ls => (
                                <div key={ls.id} className="bg-slate-800 rounded-xl p-4 border-l-4 border-green-500">
                                    <h3 className="font-bold text-lg">{ls.strategies.name}</h3>
                                    <div className="flex flex-wrap gap-1 mt-2">{ls.allocation_config.stocks.map(s => <span key={s.symbol} className="text-xs bg-slate-700 px-2 py-1 rounded">{s.symbol}</span>)}</div>
                                    <button onClick={() => handleStopStrategy(ls.id)} className="w-full mt-4 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg"><FiStopCircle /> Stop</button>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-400 text-sm p-4 bg-slate-800/50 rounded-lg">No strategies are currently active.</p>}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Available to Deploy</h2>
                    {availableStrategies.length > 0 ? (
                        <div className="space-y-4">
                            {availableStrategies.map(s => (
                                <div key={s.id} className="bg-slate-800 rounded-xl p-4">
                                    <h3 className="font-bold text-lg">{s.name}</h3>
                                    <button onClick={() => openDeployModal(s)} className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"><FiPlayCircle /> Deploy</button>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-400 text-sm p-4 bg-slate-800/50 rounded-lg">All your saved strategies are active.</p>}
                  </div>
                </>
              )}
          </div>
          <div className="w-full md:w-1/2 lg:w-3/5">
              <LiveTradeLog session={session} />
          </div>
        </main>
      </div>
    </>
  );
}