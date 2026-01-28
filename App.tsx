
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ALL_CHAMPIONS, getInitialDraftSlots, getChampionAssets } from './constants';
import { DraftSlot as IDraftSlot, Champion, AppView, LiveGameResult } from './types';
import DraftSlot from './components/DraftSlot';
import WinProbabilityChart from './components/WinProbabilityChart';
import PatchDataView from './components/PatchDataView';
import { checkLiveGameStatus, getSmartRecommendations } from './services/gridService'; // Keep for grid status/recs
import { fetchAnalysis, AnalysisResponse } from './services/api'; // New Python API

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('draft');
  const [slots, setSlots] = useState<IDraftSlot[]>(getInitialDraftSlots());
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  
  // New State from Python Backend
  const [winProbHistory, setWinProbHistory] = useState<{ step: number; prob: number }[]>([{ step: 0, prob: 50 }]);
  const [synergyScores, setSynergyScores] = useState({ blue: 0, red: 0 });
  const [predictions, setPredictions] = useState<AnalysisResponse['predictions']>([]);
  const [alerts, setAlerts] = useState<AnalysisResponse['alerts']>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]); // simplified type

  const [score, setScore] = useState({ blue: 0, red: 0 });
  const [gameResultNotification, setGameResultNotification] = useState<string | null>(null);
  
  const [isAnalysing, setIsAnalysing] = useState(false); 
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isMounted = useRef(false);

  // --- ANALYSIS LOOP (Calls Python Backend) ---
  const runAnalysis = useCallback(async () => {
    if (view !== 'draft') return;
    setIsAnalysing(true);

    // Call Python Backend
    const data = await fetchAnalysis(slots);
    
    // Update State
    setSynergyScores({ blue: data.blue_synergy_score, red: data.red_synergy_score });
    setPredictions(data.predictions);
    setAlerts(data.alerts);
    
    setWinProbHistory(prev => {
        const lastStep = prev[prev.length - 1].step;
        // Don't add duplicate steps just for re-renders
        return [...prev, { step: lastStep + 1, prob: data.blue_win_probability }];
    });

    // Keep client-side basic recommendations for the "My Team" UI
    const activeSlot = activeSlotIndex !== null ? slots[activeSlotIndex] : undefined;
    const recs = await getSmartRecommendations(slots, activeSlot, { opponentStyle: 'Teamfight', patchVersion: '14.2' });
    setRecommendations(recs);

    setIsAnalysing(false);
  }, [slots, activeSlotIndex, view]);

  useEffect(() => {
    if (!isMounted.current) {
        isMounted.current = true;
        runAnalysis();
    }
  }, [runAnalysis]);

  useEffect(() => {
      runAnalysis();
  }, [slots, runAnalysis]);

  // --- LIVE DATA POLLING ---
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const gameStatus: LiveGameResult = await checkLiveGameStatus();
      if (!gameStatus.active && gameStatus.winner) {
        handleGameEnd(gameStatus.winner);
      }
    }, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleGameEnd = (winner: 'blue' | 'red') => {
    setScore(prev => ({ ...prev, [winner]: prev[winner] + 1 }));
    setGameResultNotification(`${winner.toUpperCase()} VICTORY! Resetting...`);
    setTimeout(() => {
      setSlots(getInitialDraftSlots());
      setWinProbHistory([{ step: 0, prob: 50 }]);
      setGameResultNotification(null);
    }, 3000);
  };

  const handleActivateSlot = (index: number) => {
    const newSlots = slots.map((s, i) => ({ ...s, isActive: i === index }));
    setSlots(newSlots);
    setActiveSlotIndex(index);
    setIsSelectionOpen(false); 
  };

  const handleOpenSelection = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); 
    const newSlots = slots.map((s, i) => ({ ...s, isActive: i === index }));
    setSlots(newSlots);
    setActiveSlotIndex(index);
    setIsSelectionOpen(true);
  };

  const handleChampionSelect = (champion: Champion) => {
    if (activeSlotIndex === null) return;
    const newSlots = [...slots];
    newSlots[activeSlotIndex] = { ...newSlots[activeSlotIndex], champion: champion, isActive: false };
    setSlots(newSlots);
    setActiveSlotIndex(null); 
    setIsSelectionOpen(false);
    setSearchTerm('');
  };

  const handleClearSlot = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], champion: null };
    setSlots(newSlots);
  };

  const filteredChampions = ALL_CHAMPIONS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !slots.some(s => s.champion?.id === c.id) 
  );

  const getTeamSlots = (team: 'blue' | 'red', type: 'pick' | 'ban') => {
    return slots.map((s, i) => ({...s, originalIndex: i})).filter(s => s.team === team && s.type === type);
  };

  return (
    <div className="min-h-screen bg-hex-bg text-gray-100 font-sans selection:bg-hex-gold selection:text-black relative">
      {gameResultNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
          <div className="text-4xl font-bold text-hex-gold animate-bounce">{gameResultNotification}</div>
        </div>
      )}

      <header className="h-16 border-b border-gray-800 bg-hex-dark/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-hex-blue to-blue-900 rounded-full flex items-center justify-center font-bold text-white shadow-[0_0_10px_#0AC8B9]">R</div>
          <div className="flex flex-col cursor-pointer" onClick={() => setView('draft')}>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">Rift<span className="text-hex-blue">Mind</span></h1>
            <span className="text-[10px] text-hex-gold font-bold tracking-widest uppercase mt-0.5">Python Engine Active</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-gray-900 border border-gray-700 rounded-full px-6 py-1 shadow-inner">
            <span className="text-hex-blue font-bold text-xl">{score.blue}</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest">VS</span>
            <span className="text-red-500 font-bold text-xl">{score.red}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setView('patch')} className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${view === 'patch' ? 'bg-hex-gold text-black' : 'text-gray-400 hover:text-white'}`}>Patch Data</button>
           <button onClick={() => setView('draft')} className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${view === 'draft' ? 'bg-hex-gold text-black' : 'text-gray-400 hover:text-white'}`}>Draft</button>
        </div>
      </header>

      {view === 'patch' ? (
        <main className="container mx-auto p-4 lg:p-6 animate-fade-in"><PatchDataView /></main>
      ) : (
        <main className="container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* LEFT: Blue Team */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-team-blue/40 border-l-4 border-hex-blue p-4 rounded-r-lg">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-hex-blue font-bold uppercase tracking-widest text-sm">Blue Team</h2>
                 <span className="text-xs font-mono text-gray-400">Syn: {synergyScores.blue}</span>
              </div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {getTeamSlots('blue', 'ban').map((slot) => (
                  <DraftSlot key={slot.originalIndex} slot={slot} onClick={(e) => handleOpenSelection(e, slot.originalIndex)} onClear={(e) => handleClearSlot(e, slot.originalIndex)} />
                ))}
              </div>
              <div className="space-y-2">
                {getTeamSlots('blue', 'pick').map((slot) => {
                  return (
                    <div key={slot.originalIndex} onClick={() => handleActivateSlot(slot.originalIndex)} className={`flex items-center gap-3 bg-gray-900/50 p-2 rounded transition-all cursor-pointer hover:bg-gray-800 ${slot.isActive ? 'ring-1 ring-hex-gold' : ''}`}>
                      <DraftSlot slot={slot} onClick={(e) => handleOpenSelection(e, slot.originalIndex)} onClear={(e) => handleClearSlot(e, slot.originalIndex)} />
                      <div className="flex-1 text-sm font-bold text-white">{slot.champion?.name || "Empty"}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PREDICTIVE MODELING BOX */}
            <div className="bg-gray-900 border border-purple-900/50 p-4 rounded-lg shadow-lg">
               <h3 className="text-purple-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                 🔮 Predicted Next Picks
               </h3>
               <div className="space-y-3">
                 {predictions.map((p, idx) => (
                   <div key={idx} className="flex justify-between items-center bg-purple-900/20 p-2 rounded border border-purple-900/30">
                      <span className="font-bold text-white text-sm">{p.champion}</span>
                      <span className="text-xs text-purple-300">{p.confidence}% Conf</span>
                   </div>
                 ))}
                 {predictions.length === 0 && <span className="text-xs text-gray-600">Waiting for draft flow...</span>}
               </div>
            </div>
          </div>

          {/* MIDDLE: Board */}
          <div className="lg:col-span-6 space-y-6">
             <WinProbabilityChart data={winProbHistory} />
             
             {/* ALERTS BOX */}
             {alerts.length > 0 && (
               <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 animate-pulse">
                 {alerts.map((alert, idx) => (
                   <div key={idx} className="flex items-start gap-3">
                     <span className="text-2xl">⚠️</span>
                     <div>
                       <h4 className="text-red-400 font-bold text-sm uppercase">{alert.type}: {alert.champion}</h4>
                       <p className="text-xs text-gray-300">{alert.message}</p>
                     </div>
                   </div>
                 ))}
               </div>
             )}

             <div className="bg-gradient-to-b from-gray-900 to-hex-dark border border-gray-800 rounded-lg p-5 shadow-lg min-h-[300px]">
               <h3 className="text-hex-gold font-bold text-sm uppercase mb-4">Recommendations</h3>
                <div className="grid gap-3">
                 {isAnalysing && <span className="text-xs text-gray-500">Connecting to Python Engine...</span>}
                 {recommendations.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-800 p-2 rounded hover:bg-gray-700 cursor-pointer" onClick={() => {
                        const matched = ALL_CHAMPIONS.find(c => c.name === rec.championName);
                        if(matched) handleChampionSelect(matched);
                    }}>
                        <span className="text-white font-bold">{rec.championName}</span>
                        <span className="text-hex-gold text-sm">{rec.score} Pts</span>
                    </div>
                 ))}
               </div>
             </div>
          </div>

          {/* RIGHT: Red Team */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-team-red/40 border-r-4 border-red-800 p-4 rounded-l-lg text-right">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-mono text-gray-400">Syn: {synergyScores.red}</span>
                 <h2 className="text-red-500 font-bold uppercase tracking-widest text-sm">Red Team</h2>
              </div>
              <div className="flex gap-2 mb-4 justify-end flex-wrap">
                {getTeamSlots('red', 'ban').map((slot) => (
                  <DraftSlot key={slot.originalIndex} slot={slot} onClick={(e) => handleOpenSelection(e, slot.originalIndex)} onClear={(e) => handleClearSlot(e, slot.originalIndex)} />
                ))}
              </div>
              <div className="space-y-2">
                {getTeamSlots('red', 'pick').map((slot) => (
                  <div key={slot.originalIndex} onClick={() => handleActivateSlot(slot.originalIndex)} className={`flex items-center justify-end gap-3 bg-gray-900/50 p-2 rounded transition-all cursor-pointer hover:bg-gray-800 ${slot.isActive ? 'ring-1 ring-red-500/50' : ''}`}>
                    <div className="flex-1 text-sm font-bold text-white">{slot.champion?.name || "Empty"}</div>
                    <DraftSlot slot={slot} onClick={(e) => handleOpenSelection(e, slot.originalIndex)} onClear={(e) => handleClearSlot(e, slot.originalIndex)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Modal Logic (Same as before) */}
      {isSelectionOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-6">
           <div className="flex justify-between items-center mb-6">
             <input autoFocus type="text" placeholder="Search..." className="bg-gray-800 border-b-2 border-hex-gold text-white w-full max-w-md p-2 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             <button onClick={() => setIsSelectionOpen(false)} className="text-gray-400 text-2xl">&times;</button>
           </div>
           <div className="flex-1 overflow-y-auto grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
             {filteredChampions.map(champ => {
               const assets = getChampionAssets(champ.id);
               return (
                <div key={champ.id} onClick={() => handleChampionSelect(champ)} className="cursor-pointer relative aspect-square border border-gray-700 hover:border-hex-blue">
                  <img src={assets.square} alt={champ.name} className="w-full h-full object-cover grayscale hover:grayscale-0" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1"><p className="text-center text-xs text-white truncate">{champ.name}</p></div>
                </div>
               );
             })}
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
