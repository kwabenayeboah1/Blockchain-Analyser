
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Loader2, Info, Activity, ArrowRight, ShieldAlert, Zap, CheckCircle2, Clock, Wallet, X, TrendingUp, BarChart3, Settings2, Hash, History, Box, Trash2, ShieldCheck, Radar, Fingerprint, AlertCircle } from 'lucide-react';
import { blockchainService } from './services/blockchainService';
import { analyzeTransaction, analyzeAddressBehavior } from './services/geminiService';
import { priceService } from './services/priceService';
import { Transaction } from './types';
import GraphVisualizer from './components/GraphVisualizer';

interface HistoryItem {
  txid: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('251f4928173eb0e024b23df28e9db441fbe4ac09b9a1598f4b2b8cc96847ce48'); 
  const [txData, setTxData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [gbpPrice, setGbpPrice] = useState<number>(0);

  // History State
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Address Analysis State
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addressData, setAddressData] = useState<any | null>(null);
  const [addressTxs, setAddressTxs] = useState<any[]>([]);
  const [addressAnalysis, setAddressAnalysis] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Contacting global node network...",
    "Retrieving UTXO history...",
    "Scanning for peel chains...",
    "Identifying script types (SegWit/Taproot)...",
    "Running Gemini Forensic Engine...",
    "Finalizing behavior risk report..."
  ];

  useEffect(() => {
    priceService.getBTCPriceInGBP().then(setGbpPrice);
    
    const savedHistory = localStorage.getItem('btc_trace_history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    handleSearch();
  }, []);

  useEffect(() => {
    localStorage.setItem('btc_trace_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // Loading message rotator
  useEffect(() => {
    let interval: any;
    if (addressLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [addressLoading]);

  const addToHistory = (txid: string) => {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.txid !== txid);
      return [{ txid, timestamp: Date.now() }, ...filtered].slice(0, 20);
    });
  };

  const formatGBP = useCallback((sats: number) => {
    if (!gbpPrice) return '£0.00';
    const btc = sats / 100000000;
    const gbpValue = btc * gbpPrice;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(gbpValue);
  }, [gbpPrice]);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const query = overrideQuery || searchQuery.trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setAiAnalysis(null);
    setSelectedAddress(null);
    setIsHistoryOpen(false);
    
    try {
      const data = await blockchainService.getTransaction(query);
      setTxData(data);
      addToHistory(query);
      if (overrideQuery) setSearchQuery(overrideQuery);
      
      setAnalyzing(true);
      const analysis = await analyzeTransaction(data);
      setAiAnalysis(analysis);
    } catch (err) {
      setError('Transaction not found. Ensure it is a valid 64-char TXID.');
      setTxData(null);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const handleNodeClick = async (id: string, type: 'address' | 'transaction') => {
    if (type === 'transaction') {
      handleSearch(undefined, id);
    } else {
      setSelectedAddress(id);
      setAddressLoading(true);
      setAddressAnalysis(null);
      setAddressError(null);
      try {
        const stats = await blockchainService.getAddress(id);
        const txs = await blockchainService.getAddressTxs(id);
        setAddressData(stats);
        setAddressTxs(txs);
        
        if (stats.chain_stats.tx_count > 0) {
          const analysis = await analyzeAddressBehavior(id, stats.chain_stats, txs);
          setAddressAnalysis(analysis);
        } else {
          setAddressAnalysis("No on-chain activity detected for this address. It currently holds no balance and has no transaction history.");
        }
      } catch (err) {
        setAddressError("Forensic scan failed. The network could not be reached.");
        console.error("Address fetch failed", err);
      } finally {
        setAddressLoading(false);
      }
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('btc_trace_history');
  };

  const isConfirmed = txData?.status?.confirmed;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative overflow-hidden">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-2 bg-amber-500 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <span className="text-slate-950 font-bold text-xl leading-none">₿</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent hidden sm:inline">
              Blockchain Analytics
            </h1>
          </div>
          
          <div className="flex-1 max-w-2xl flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter TXID to trace..."
                className="w-full bg-slate-800 border-slate-700 rounded-full py-2 pl-10 pr-24 focus:ring-2 focus:ring-amber-500 outline-none mono text-sm transition-all text-slate-100 placeholder:text-slate-600"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-1 top-1 bottom-1 px-4 bg-amber-500 text-slate-950 rounded-full text-xs font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'TRACE'}
              </button>
            </form>
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 transition-all text-slate-400 hover:text-amber-400"
              title="Search History"
            >
              <History className="w-5 h-5" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-400 shrink-0">
             <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-500" /> Live Mempool</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        <div className="lg:col-span-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] pr-2 custom-scrollbar">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">Trace Failed</p>
                <p className="text-xs text-red-500/70">{error}</p>
              </div>
            </div>
          )}

          {txData && (
            <>
              <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" /> TRANSACTION SPECS
                  </h3>
                  {isConfirmed ? (
                    <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-bold flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3" /> MEMPOOL
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Hash</span>
                    <span className="text-xs mono break-all text-amber-400 select-all leading-relaxed">{txData.hash}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <span className="text-[10px] text-slate-500 block mb-1 uppercase tracking-tight">Fee (GBP)</span>
                      <span className="text-sm font-semibold">{(txData.fee / 100000000).toFixed(8)} BTC</span>
                      <p className="text-[10px] text-slate-500 mt-1">{formatGBP(txData.fee)}</p>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <span className="text-[10px] text-slate-500 block mb-1 uppercase tracking-tight">Status</span>
                      <span className="text-sm font-semibold">{isConfirmed ? 'In Block' : 'Unconfirmed'}</span>
                      <p className="text-[10px] text-slate-500 mt-1">{isConfirmed ? `#${txData.status.block_height}` : 'Pending'}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-slate-400" /> ADVANCED DETAILS
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Version</span>
                    <span className="text-xs font-mono">{txData.ver}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Locktime</span>
                    <span className="text-xs font-mono">{txData.locktime || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Size / Weight</span>
                    <span className="text-xs font-mono">{txData.size} B / {txData.weight} WU</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Virtual Size</span>
                    <span className="text-xs font-mono">{Math.ceil(txData.weight / 4)} vB</span>
                  </div>
                </div>
              </section>

              <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-800/50">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" /> AI ANALYSIS
                  </h3>
                </div>
                <div className="p-4">
                  {analyzing ? (
                    <div className="flex items-center gap-3 py-4 text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm italic">Analyzing forensic markers...</span>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {aiAnalysis || "Analysis not available."}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
          <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner">
             <GraphVisualizer data={txData} onNodeClick={handleNodeClick} aiAnalysis={aiAnalysis} gbpPrice={gbpPrice} />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-[10px]">
                <p className="text-slate-300 font-bold uppercase tracking-wider">Address Insights</p>
                <p className="text-slate-500">Click any wallet address to reveal deep forensic behavior and risk scoring.</p>
              </div>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-[10px]">
                <p className="text-slate-300 font-bold uppercase tracking-wider">GBP Real-time</p>
                <p className="text-slate-500">Current Rate: £{gbpPrice.toLocaleString()} per BTC. Updated via CoinGecko.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search History Panel */}
        <aside 
          className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-slate-900 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-slate-800 z-[70] transition-transform duration-300 transform p-6 flex flex-col gap-6 overflow-y-auto ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" /> Trace History
            </h2>
            <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {searchHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-50">
                <Box className="w-12 h-12" />
                <p className="text-sm">No recent traces found.</p>
              </div>
            ) : (
              searchHistory.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleSearch(undefined, item.txid)}
                  className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl hover:border-amber-500/50 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">TRANSACTION ID</span>
                    <span className="text-[9px] text-slate-600 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-mono text-amber-200 truncate group-hover:text-amber-400">{item.txid}</p>
                </div>
              ))
            )}
          </div>

          {searchHistory.length > 0 && (
            <button 
              onClick={clearHistory}
              className="mt-auto flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" /> CLEAR ALL HISTORY
            </button>
          )}
        </aside>

        {/* Deep Address Analysis Side Panel */}
        <aside 
          className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-slate-900 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-slate-800 z-[60] transition-transform duration-300 transform p-6 flex flex-col gap-6 overflow-y-auto ${selectedAddress ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-100">
              <Wallet className="w-5 h-5 text-indigo-400" /> Forensic Deep-Scan
            </h2>
            <button onClick={() => setSelectedAddress(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors group">
              <X className="w-5 h-5 text-slate-400 group-hover:text-slate-100" />
            </button>
          </div>

          {selectedAddress && (
            <div className="space-y-6 pb-8">
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/20 shadow-inner">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1 font-bold">Target Address</span>
                <span className="text-xs font-mono break-all text-indigo-300 select-all leading-relaxed">{selectedAddress}</span>
              </div>

              {addressError && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-400 font-medium">{addressError}</p>
                </div>
              )}

              {addressLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-10">
                  <div className="relative">
                    {/* Layered Forensic Radar Spinner */}
                    <div className="w-32 h-32 rounded-full border-4 border-indigo-500/5 border-t-indigo-500/60 animate-spin [animation-duration:1.2s]"></div>
                    <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-indigo-500/10 border-r-indigo-400 animate-spin [animation-duration:2s] [animation-direction:reverse]"></div>
                    <div className="absolute inset-0 w-32 h-32 rounded-full border border-indigo-400/20 animate-pulse"></div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-4 bg-indigo-500/10 rounded-full backdrop-blur-sm border border-indigo-500/20">
                        <Radar className="w-8 h-8 text-indigo-400 animate-pulse" />
                      </div>
                    </div>
                    
                    {/* Radar ping circles */}
                    <div className="absolute inset-0 w-32 h-32 rounded-full border-2 border-indigo-500/30 animate-ping opacity-20"></div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-6 w-full px-6 text-center">
                    <div className="flex items-center gap-2 py-1 px-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">
                      <Activity className="w-3 h-3" />
                      <span>Live Forensic Trace</span>
                    </div>
                    
                    <div className="h-16 flex flex-col items-center justify-center">
                      <p className="text-sm text-slate-100 font-medium transition-all duration-500 tracking-tight">
                        {loadingSteps[loadingStep]}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2 italic font-mono uppercase tracking-tighter">
                        Verifying signatures • Mapping capital flows
                      </p>
                    </div>

                    <div className="w-full space-y-2">
                       <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                          style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[8px] font-bold text-slate-600 uppercase tracking-widest px-1">
                        <span>Phase {loadingStep + 1}</span>
                        <span>{Math.round(((loadingStep + 1) / loadingSteps.length) * 100)}% Complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : addressData && !addressError && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm">
                      <span className="text-[10px] text-slate-500 block mb-1 uppercase tracking-tight font-bold">Total Received</span>
                      <span className="text-sm font-bold text-green-400">{((addressData?.chain_stats?.funded_txo_sum || 0) / 100000000).toFixed(4)} BTC</span>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{formatGBP(addressData?.chain_stats?.funded_txo_sum || 0)}</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm">
                      <span className="text-[10px] text-slate-500 block mb-1 uppercase tracking-tight font-bold">Total Sent</span>
                      <span className="text-sm font-bold text-red-400">{((addressData?.chain_stats?.spent_txo_sum || 0) / 100000000).toFixed(4)} BTC</span>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{formatGBP(addressData?.chain_stats?.spent_txo_sum || 0)}</p>
                    </div>
                    
                    <div className="p-4 bg-indigo-950/20 rounded-xl border border-indigo-500/20 col-span-2 flex justify-between items-center shadow-sm">
                      <div>
                        <span className="text-[10px] text-indigo-400 block mb-1 uppercase tracking-widest font-bold">Liquid Balance</span>
                        <span className="text-xl font-bold text-indigo-100">
                          {(((addressData?.chain_stats?.funded_txo_sum || 0) - (addressData?.chain_stats?.spent_txo_sum || 0)) / 100000000).toFixed(8)} BTC
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-100 block">{formatGBP((addressData?.chain_stats?.funded_txo_sum || 0) - (addressData?.chain_stats?.spent_txo_sum || 0))}</span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-tighter font-bold">Estimated GBP Value</span>
                      </div>
                    </div>
                  </div>

                  {addressTxs.length > 0 && (
                    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                      <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                        <h3 className="text-xs font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                          <Box className="w-4 h-4 text-indigo-400" /> On-Chain Activity Metrics
                        </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                            <span className="text-[9px] text-slate-500 block mb-1 uppercase font-bold tracking-tighter">Last Active</span>
                            <span className="text-xs font-mono text-slate-300">{addressTxs[0].status.confirmed ? 'Confirmed' : 'Pending'}</span>
                          </div>
                          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                            <span className="text-[9px] text-slate-500 block mb-1 uppercase font-bold tracking-tighter">TX Count</span>
                            <span className="text-xs font-mono text-slate-300">{addressData.chain_stats.tx_count}</span>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-indigo-500/20 bg-indigo-500/10 flex items-center justify-between">
                      <h3 className="text-xs font-bold flex items-center gap-2 text-indigo-300 uppercase tracking-widest">
                        <Fingerprint className="w-4 h-4" /> Gemini Behavior Intelligence
                      </h3>
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="p-4">
                      {addressAnalysis ? (
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300 text-[12px] leading-relaxed whitespace-pre-wrap font-medium">
                          {addressAnalysis}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 py-6 text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs italic">Awaiting AI pattern response...</span>
                        </div>
                      )}
                    </div>
                  </section>
                  
                  <div className="flex gap-3 sticky bottom-0 bg-slate-900 pt-6 border-t border-slate-800/50 pb-2">
                    <button 
                      onClick={() => window.open(`https://mempool.space/address/${selectedAddress}`, '_blank')}
                      className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-700 uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <span>Mempool.space</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setSelectedAddress(null)}
                      className="py-3 px-8 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] uppercase tracking-widest"
                    >
                      DISMISS
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </aside>
      </main>

      <footer className="border-t border-slate-900 py-6 bg-slate-950 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[10px] font-medium uppercase tracking-widest">
          <p>© 2024 Blockchain Analytics • Advanced BTC Forensics • AI Intelligence</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-amber-500/80 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              BTC/GBP: £{gbpPrice.toLocaleString()}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              Network Status: Nominal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
