import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ALL_CHAMPIONS, getInitialDraftSlots, getChampionAssets } from './constants';
import { DraftSlot as IDraftSlot, Champion, AnalysisResult, SimulationConfig, AppView, LiveGameResult } from './types';
import DraftSlot from './components/DraftSlot';
import WinProbabilityChart from './components/WinProbabilityChart';
import PatchDataView from './components/PatchDataView';
import { getSmartRecommendations, getHeuristicAnalysis, checkLiveGameStatus } from './services/gridService';

// Skeleton Component for Recommendations
const RecommendationSkeleton = () => (
  <div className="bg-gray-800/30 border border-gray-800 rounded p-3 flex items-center gap-4 animate-pulse">
    <div className="w-12 h-12 bg-gray-700 rounded-md"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      <div className="h-3 bg-gray-700/50 rounded w-3/4"></div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('draft');
  const [slots, setSlots] = useState<IDraftSlot[]>(getInitialDraftSlots());
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [winProbHistory, setWinProbHistory] = useState<{ step: number; prob: number }[]>([{ step: 0, prob: 50 }]);
  
  // Scoreboard State
  const [score, setScore] = useState({ blue: 0, red: 0 });
  const [gameResultNotification, setGameResultNotification] = useState<string | null>(null);

  // Analysis State
  const [recommendations, setRecommendations] = useState<AnalysisResult['recommendations']>([]);
  const [insight, setInsight] = useState<{ text: string; threats: string[] }>({ 
    text: "Select a slot to begin drafting.", 
    threats: [] 
  });
  
  const [isAnalysing, setIsAnalysing] = useState(false); 
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Config with default strategy since selector is removed
  const [config, setConfig] = useState<SimulationConfig>({
    opponentStyle: 'Teamfight',
    patchVersion: '14.2'
  });

  const activeSlot = activeSlotIndex !== null ? slots[activeSlotIndex] : undefined;
  const isMounted = useRef(false);

  // --- LIVE DATA POLLING & RESET LOGIC ---
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // In production, this hits GRID API
      const gameStatus: LiveGameResult = await checkLiveGameStatus();
      
      // LOGIC: If game is NOT active and we have a winner, trigger reset
      if (!gameStatus.active && gameStatus.winner) {
        handleGameEnd(gameStatus.winner);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(pollInterval);
  }, []);

  const handleGameEnd = (winner: 'blue' | 'red') => {
    // 1. Update Score
    setScore(prev => ({
      ...prev,
      [winner]: prev[winner] + 1
    }));

    // 2. Show Notification
    setGameResultNotification(`${winner.toUpperCase()} VICTORY! Resetting Draft...`);

    // 3. Reset Draft after delay
    setTimeout(() => {
      setSlots(getInitialDraftSlots());
      setWinProbHistory([{ step: 0, prob: 50 }]);
      setGameResultNotification(null);
      setInsight({ text: "New Game Started.", threats: [] });
    }, 3000);
  };

  // Temporary function for DEV only to simulate "GRID" sending a game end signal
  const devSimulateGameEnd = (winner: 'blue' | 'red') => {
    handleGameEnd(winner);
  };

  // --- CORE ANALYSIS LOOP ---
  const runAnalysis = useCallback(async () => {
    if (view !== 'draft') return; // Don't analyze if viewing patch data

    setIsAnalysing(true);
    
    // 1. Get Recommendations
    const recs = await getSmartRecommendations(slots, activeSlot, config);
    setRecommendations(recs);

    // 2. Get Global Board Analysis
    const analysis = getHeuristicAnalysis(slots, config);
    
    setInsight({
        text: analysis.strategicInsight,
        threats: analysis.opponentThreats
    });

    setWinProbHistory(prev => {
        const lastStep = prev[prev.length - 1].step;
        return [...prev, { step: lastStep + 1, prob: analysis.blueWinProbability }];
    });

    setIsAnalysing(false);
  }, [slots, activeSlot, config, view]);

  useEffect(() => {
    if (!isMounted.current) {
        isMounted.current = true;
        runAnalysis();
    }
  }, [runAnalysis]);

  // Just activate the slot (for recommendations), do NOT open modal
  const handleActivateSlot = (index: number) => {
    const newSlots = slots.map((s, i) => ({ ...s, isActive: i === index }));
    setSlots(newSlots);
    setActiveSlotIndex(index);
    setIsSelectionOpen(false); 
  };

  // Activate AND open modal
  const handleOpenSelection = (e: React.MouseEvent, index: number) => {
    e.stopPropagation(); 
    const newSlots = slots.map((s, i) => ({ ...s, isActive: i === index }));
    setSlots(newSlots);
    setActiveSlotIndex(index);
    setIsSelectionOpen(true);
  };

  useEffect(() => {
      runAnalysis();
  }, [activeSlotIndex, runAnalysis]);

  const handleChampionSelect = (champion: Champion) => {
    if (activeSlotIndex === null) return;

    const newSlots = [...slots];
    newSlots[activeSlotIndex] = {
        ...newSlots[activeSlotIndex],
        champion: champion,
        isActive: false
    };
    
    setSlots(newSlots);
    setActiveSlotIndex(null); 
    setIsSelectionOpen(false);
    setSearchTerm('');
  };

  const handleClearSlot = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newSlots = [...slots];
    newSlots[index] = {
        ...newSlots[index],
        champion: null
    };
    setSlots(newSlots);
  };

  useEffect(() => {
    runAnalysis();
  }, [slots, runAnalysis]);

  const filteredChampions = ALL_CHAMPIONS.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !slots.some(s => s.champion?.id === c.id) 
  );

  const getTeamSlots = (team: 'blue' | 'red', type: 'pick' | 'ban') => {
    return slots.map((s, i) => ({...s, originalIndex: i})).filter(s => s.team === team && s.type === type);
  };

  const getRecTitle = () => {
    if (!activeSlot) return "Top Global Meta Picks";
    if (activeSlot.champion) return `Counter Picks for ${activeSlot.champion.name}`;
    return `Recommended ${activeSlot.type === 'ban' ? 'Bans' : 'Picks'} for ${activeSlot.team}`;
  };

  return (
    <div className="min-h-screen bg-hex-bg text-gray-100 font-sans selection:bg-hex-gold selection:text-black relative">
      
      {/* Game End Overlay */}
      {gameResultNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
          <div className="text-4xl font-bold text-hex-gold animate-bounce">
            {gameResultNotification}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-gray-800 bg-hex-dark/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-hex-blue to-blue-900 rounded-full flex items-center justify-center font-bold text-white shadow-[0_0_10px_#0AC8B9]">R</div>
          <div className="flex flex-col cursor-pointer" onClick={() => setView('draft')}>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">Rift<span className="text-hex-blue">Mind</span></h1>
            <span className="text-[10px] text-hex-gold font-bold tracking-widest uppercase mt-0.5">Grid Edition</span>
          </div>
        </div>
        
        {/* Scoreboard */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-gray-900 border border-gray-700 rounded-full px-6 py-1 shadow-inner">
            <span className="text-hex-blue font-bold text-xl">{score.blue}</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest">VS</span>
            <span className="text-red-500 font-bold text-xl">{score.red}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setView('patch')}
             className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${view === 'patch' ? 'bg-hex-gold text-black' : 'text-gray-400 hover:text-white'}`}
           >
             Patch Data
           </button>
           <button 
             onClick={() => setView('draft')}
             className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded transition-colors ${view === 'draft' ? 'bg-hex-gold text-black' : 'text-gray-400 hover:text-white'}`}
           >
             Draft
           </button>
        </div>
      </header>

      {view === 'patch' ? (
        <main className="container mx-auto p-4 lg:p-6 animate-fade-in">
           <PatchDataView />
        </main>
      ) : (
        <main className="container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* LEFT COLUMN: Blue Team & Analysis */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-team-blue/40 border-l-4 border-hex-blue p-4 rounded-r-lg">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-hex-blue font-bold uppercase tracking-widest text-sm">Blue Team</h2>
              </div>
              
              {/* Bans */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {getTeamSlots('blue', 'ban').map((slot) => (
                  <DraftSlot 
                      key={slot.originalIndex} 
                      slot={slot} 
                      onClick={(e) => handleOpenSelection(e, slot.originalIndex)} 
                      onClear={(e) => handleClearSlot(e, slot.originalIndex)}
                  />
                ))}
              </div>

              {/* Picks */}
              <div className="space-y-2">
                {getTeamSlots('blue', 'pick').map((slot) => {
                  const assets = slot.champion ? getChampionAssets(slot.champion.id) : null;
                  return (
                    <div 
                      key={slot.originalIndex} 
                      onClick={() => handleActivateSlot(slot.originalIndex)}
                      className={`flex items-center gap-3 bg-gray-900/50 p-2 rounded transition-all duration-300 cursor-pointer hover:bg-gray-800 border border-transparent hover:border-hex-blue/30 ${slot.isActive ? 'ring-1 ring-hex-gold bg-gray-800' : ''}`}
                    >
                      <DraftSlot 
                          slot={slot} 
                          onClick={(e) => handleOpenSelection(e, slot.originalIndex)} 
                          onClear={(e) => handleClearSlot(e, slot.originalIndex)}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{slot.champion?.name || "Empty"}</div>
                        <div className="text-xs text-gray-500">{slot.champion?.roles.join(', ') || "Blue Pick"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
               <h3 className="text-gray-400 text-xs font-bold uppercase mb-3">Draft Insight</h3>
               <div className="text-sm text-gray-300 leading-relaxed min-h-[60px]">
                   <span className="animate-fade-in">{insight.text}</span>
               </div>
               
               {/* DEV BUTTON FOR SIMULATION */}
               <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between opacity-50 hover:opacity-100 transition-opacity">
                 <span className="text-[10px] text-gray-600">DEV: Simulate End</span>
                 <div className="flex gap-2">
                   <button onClick={() => devSimulateGameEnd('blue')} className="text-[10px] bg-blue-900/50 text-blue-300 px-2 rounded">Blue Win</button>
                   <button onClick={() => devSimulateGameEnd('red')} className="text-[10px] bg-red-900/50 text-red-300 px-2 rounded">Red Win</button>
                 </div>
               </div>
            </div>
          </div>

          {/* MIDDLE COLUMN: Draft Board & Predictions */}
          <div className="lg:col-span-6 space-y-6">
             
             {/* Visual Header / Win Prob Only */}
             <WinProbabilityChart data={winProbHistory} />

             {/* Recommendations Panel */}
             <div className="bg-gradient-to-b from-gray-900 to-hex-dark border border-gray-800 rounded-lg p-5 shadow-lg min-h-[400px]">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-hex-gold font-bold text-sm uppercase flex items-center gap-2">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
                   {getRecTitle()}
                 </h3>
                 {isAnalysing && <span className="text-xs text-hex-blue animate-pulse">Scanning Grid Data...</span>}
               </div>
               
               <div className="grid gap-3">
                 {isAnalysing ? (
                   <>
                     <RecommendationSkeleton />
                     <RecommendationSkeleton />
                     <RecommendationSkeleton />
                   </>
                 ) : (
                   <>
                    {recommendations.map((rec, idx) => {
                      const matchedChamp = ALL_CHAMPIONS.find(c => c.name === rec.championName);
                      const recAssets = matchedChamp ? getChampionAssets(matchedChamp.id) : null;
                      
                      return (
                        <div key={idx} className="group relative bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-hex-blue transition-all rounded p-3 flex items-start gap-4 cursor-pointer"
                          onClick={() => {
                            if (matchedChamp) handleChampionSelect(matchedChamp);
                          }}
                        >
                          <div className="absolute top-0 right-0 p-1">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              rec.type === 'counter' ? 'bg-red-900 text-red-300' :
                              rec.type === 'synergy' ? 'bg-indigo-900 text-indigo-300' :
                              'bg-green-900 text-green-300'
                            }`}>
                              {rec.type}
                            </span>
                          </div>
                          <div className="w-12 h-12 bg-black rounded flex-shrink-0 overflow-hidden">
                            {recAssets && (
                              <img 
                                src={recAssets.square} 
                                alt={rec.championName} 
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                              <h4 className="font-bold text-white group-hover:text-hex-blue">{rec.championName}</h4>
                              <span className="text-hex-gold font-mono text-sm">{rec.score} Pts</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{rec.reasoning}</p>
                          </div>
                        </div>
                      );
                    })}
                    
                    {(recommendations.length === 0) && (
                      <div className="text-center py-12 text-gray-500 text-sm flex flex-col items-center">
                        <span className="opacity-30 text-5xl mb-3">⚔️</span>
                        No data available.
                      </div>
                    )}
                   </>
                 )}
               </div>
             </div>
          </div>

          {/* RIGHT COLUMN: Red Team & Threats */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-team-red/40 border-r-4 border-red-800 p-4 rounded-l-lg text-right">
              <h2 className="text-red-500 font-bold uppercase tracking-widest text-sm mb-4">Red Team</h2>
              
              {/* Bans */}
              <div className="flex gap-2 mb-4 justify-end flex-wrap">
                {getTeamSlots('red', 'ban').map((slot) => (
                  <DraftSlot 
                      key={slot.originalIndex} 
                      slot={slot} 
                      onClick={(e) => handleOpenSelection(e, slot.originalIndex)} 
                      onClear={(e) => handleClearSlot(e, slot.originalIndex)}
                  />
                ))}
              </div>

              {/* Picks */}
              <div className="space-y-2">
                {getTeamSlots('red', 'pick').map((slot) => (
                  <div 
                    key={slot.originalIndex} 
                    onClick={() => handleActivateSlot(slot.originalIndex)}
                    className={`flex items-center justify-end gap-3 bg-gray-900/50 p-2 rounded transition-all duration-300 cursor-pointer hover:bg-gray-800 border border-transparent hover:border-red-500/30 ${slot.isActive ? 'ring-1 ring-red-500/50 bg-gray-800' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{slot.champion?.name || "Empty"}</div>
                      <div className="text-xs text-gray-500">{slot.champion?.roles.join(', ') || "Red Pick"}</div>
                    </div>
                    <DraftSlot 
                        slot={slot} 
                        onClick={(e) => handleOpenSelection(e, slot.originalIndex)} 
                        onClear={(e) => handleClearSlot(e, slot.originalIndex)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Opponent Threats */}
            <div className="bg-gray-900 border border-red-900/30 p-4 rounded-lg">
               <h3 className="text-red-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 Active Threats
               </h3>
               <ul className="space-y-2">
                  <>
                    {insight.threats.map((threat, i) => (
                      <li key={i} className="text-xs text-gray-300 bg-red-950/30 p-2 rounded border-l-2 border-red-600 animate-fade-in">
                        {threat}
                      </li>
                    ))}
                    {(insight.threats.length === 0) && (
                      <li className="text-xs text-gray-600 italic">No threats analyzed.</li>
                    )}
                   </>
               </ul>
            </div>
          </div>
        </main>
      )}

      {/* Champion Select Modal */}
      {isSelectionOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-6 animate-fade-in">
           <div className="flex justify-between items-center mb-6">
             <input 
               autoFocus
               type="text" 
               placeholder="Search Champion..." 
               className="bg-gray-800 border-b-2 border-hex-gold text-2xl font-bold text-white w-full max-w-md p-2 outline-none"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <button onClick={() => setIsSelectionOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
           </div>
           
           <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pb-20">
             {filteredChampions.map(champ => {
               const assets = getChampionAssets(champ.id);
               return (
                <div 
                  key={champ.id} 
                  onClick={() => handleChampionSelect(champ)}
                  className="group cursor-pointer relative aspect-square border border-gray-700 hover:border-hex-blue transition-all transform hover:scale-105"
                >
                  <img 
                      src={assets.square} 
                      alt={champ.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1">
                    <p className="text-center text-xs font-bold text-white truncate">{champ.name}</p>
                  </div>
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