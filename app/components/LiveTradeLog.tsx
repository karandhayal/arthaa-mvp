'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient, Session } from '@supabase/auth-helpers-nextjs';
import { FiActivity, FiAlertTriangle } from 'react-icons/fi';

type TradeLog = {
  id: string;
  trade_type: string;
  stock_symbol: string;
  quantity: number;
  price: number;
  status: string;
  reason: string;
  executed_at: string;
};

type LiveTradeLogProps = {
  session: Session | null;
};

export default function LiveTradeLog({ session }: LiveTradeLogProps) {
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!session) return;

    const fetchLogs = async () => {
      const { data } = await supabase
        .from('trade_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('executed_at', { ascending: false })
        .limit(50);
      if (data) setLogs(data as TradeLog[]);
    };
    fetchLogs();

    const channel = supabase
      .channel('trade_logs_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trade_logs', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          setLogs((currentLogs) => [payload.new as TradeLog, ...currentLogs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, supabase]);

  return (
    <div className="bg-slate-800 rounded-xl p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">Live Trade Log</h2>
      <div className="flex-grow overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <FiActivity size={40} />
            <p className="mt-2 text-sm">Waiting for trading activity...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className={`p-3 rounded-lg ${log.status === 'failed' ? 'bg-red-900/30' : 'bg-slate-700/50'}`}>
                <div className="flex justify-between items-center text-sm">
                  <span className={`font-bold ${
                      log.trade_type === 'buy' ? 'text-green-400' : 
                      log.trade_type === 'sell' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {log.trade_type.toUpperCase()} - {log.stock_symbol}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(log.executed_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                    {log.status === 'failed' && <FiAlertTriangle className="inline-block text-red-400 mr-1" />}
                    {log.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}