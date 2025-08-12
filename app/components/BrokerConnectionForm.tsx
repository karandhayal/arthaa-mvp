'use client';

import { useState, useEffect } from 'react';
export default function BrokerConnectionForm() {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [clientID, setClientID] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const supabase = createClientComponentClient();

  // Check if keys are already saved when the component loads
  useEffect(() => {
    const checkKeys = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: config } = await supabase
                .from('broker_config')
                .select('api_key')
                .eq('user_id', user.id)
                .single();
            if (config && config.api_key) {
                setKeysSaved(true);
            }
        }
    };
    checkKeys();
  }, [supabase]);


  const handleSaveKeys = async () => {
    setLoading(true);
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    };

    const { error } = await supabase
      .from('broker_config')
      .upsert({
        user_id: user.id,
        broker: 'angelone',
        api_key: apiKey,
        secret_key: secretKey,
        client_id: clientID,
      }, { onConflict: 'user_id' });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Your Angel One keys have been saved successfully!');
      setKeysSaved(true);
      setApiKey('');
      setSecretKey('');
      setClientID('');
    }
    setLoading(false);
  };

  const handleLogin = () => {
      // This will redirect the user to our API route, which then redirects to Angel One
      window.location.href = '/api/angelone/login';
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Angel One API Key</label>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" placeholder="Your SmartAPI Key" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Angel One Secret Key</label>
        <input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" placeholder="Your SmartAPI Secret Key" />
      </div>
       <div>
        <label className="block text-sm font-medium mb-1">Angel One Client ID</label>
        <input type="text" value={clientID} onChange={(e) => setClientID(e.target.value)} className="w-full bg-slate-700 p-2 rounded-md" placeholder="Your Angel One Client ID" />
      </div>
      <button onClick={handleSaveKeys} disabled={loading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-slate-500">
        {loading ? 'Saving...' : 'Save Keys'}
      </button>
      {message && <p className="text-sm text-center mt-2">{message}</p>}

      {/* --- NEW: Login Button --- */}
      <div className="pt-4 border-t border-slate-700">
          <button 
            onClick={handleLogin}
            disabled={!keysSaved}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            Login with Angel One
          </button>
          {!keysSaved && <p className="text-xs text-slate-400 text-center mt-2">Please save your API keys to enable login.</p>}
      </div>
    </div>
  );
}
