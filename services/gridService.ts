
import { DraftSlot, Recommendation, Champion, SimulationConfig, PatchStats, LiveGameResult } from "../types";
import { ALL_CHAMPIONS } from "../constants";

export interface GridStats {
  championId: string;
  winRate: number;
  pickRate: number;
  gamesPlayed: number;
}

// --- CONFIGURATION ---
// SECURITY NOTE: API Keys are loaded from environment variables.
// 1. Create a .env file in the root directory.
// 2. Add: REACT_APP_GRID_API_KEY=your_key_here
const GRID_API_KEY = process.env.REACT_APP_GRID_API_KEY || ""; 
const LIVE_GAME_ENDPOINT = "https://api.grid.gg/live-data-feed/v1"; // Placeholder URL

// Mock data generator (Simulating GRID API)
const mockGridResponse = (ids: string[]): Record<string, GridStats> => {
  const stats: Record<string, GridStats> = {};
  ids.forEach(id => {
    // Deterministic mock stats based on char code
    const seed = id.charCodeAt(0) + id.length; 
    stats[id] = {
      championId: id,
      winRate: 48 + (seed % 7), // 48-55% WR range
      pickRate: 5 + (seed % 20),
      gamesPlayed: 100 + (seed * 10)
    };
  });
  return stats;
};

// --- PATCH DATA SERVICE ---
export const getPatchData = async (patchVersion: string): Promise<PatchStats[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));

  return ALL_CHAMPIONS.map(champ => {
    const seed = champ.id.charCodeAt(0);
    const wr = 46 + (seed % 10);
    
    let tier: PatchStats['tier'] = 'B';
    if (wr > 53) tier = 'S';
    else if (wr > 51) tier = 'A';
    else if (wr < 48) tier = 'D';

    return {
      championName: champ.name,
      role: champ.roles[0],
      winRate: wr,
      pickRate: 2 + (seed % 15),
      banRate: 1 + (seed % 30),
      tier: tier
    };
  }).sort((a, b) => b.winRate - a.winRate);
};

// --- LIVE GAME SERVICE ---
// This function simulates checking a live game endpoint.
// In a real app, you would fetch(LIVE_GAME_ENDPOINT) using the API key.
export const checkLiveGameStatus = async (): Promise<LiveGameResult> => {
   // --- REAL IMPLEMENTATION EXAMPLE ---
   /*
   if (GRID_API_KEY) {
      try {
        const response = await fetch(`${LIVE_GAME_ENDPOINT}/match-state`, { headers: { 'x-api-key': GRID_API_KEY } });
        const data = await response.json();
        // Assuming data structure has { status: 'completed', winner: 'blue' }
        if (data.status === 'completed') {
            return { active: false, winner: data.winner };
        }
        return { active: true };
      } catch (e) { console.error("Grid API Error", e); }
   }
   */

   // --- SIMULATION FOR DEMO ---
   // To TEST the Win/Lose logic manually:
   // Change 'active' to false and set a 'winner'.
   // Example: return { active: false, winner: 'blue' };
   
   return { active: true }; 
};


// --- EXISTING DRAFT LOGIC ---

export const getHeuristicAnalysis = (
  slots: DraftSlot[],
  config: SimulationConfig
): { blueWinProbability: number; strategicInsight: string; opponentThreats: string[] } => {
  
  const bluePicks = slots.filter(s => s.team === 'blue' && s.type === 'pick' && s.champion).map(s => s.champion!);
  const redPicks = slots.filter(s => s.team === 'red' && s.type === 'pick' && s.champion).map(s => s.champion!);

  // 1. Base Stats Calculation
  let blueScore = 0;
  let redScore = 0;

  const blueStats = mockGridResponse(bluePicks.map(c => c.id));
  const redStats = mockGridResponse(redPicks.map(c => c.id));

  // Add raw winrate diff
  bluePicks.forEach(c => blueScore += (blueStats[c.id].winRate - 50));
  redPicks.forEach(c => redScore += (redStats[c.id].winRate - 50));

  // 2. Counter Matchup Calculation
  let counterDelta = 0;
  
  // Check if Blue counters Red
  bluePicks.forEach(blueChamp => {
    redPicks.forEach(redChamp => {
        if (blueChamp.counters.includes(redChamp.id)) {
            counterDelta += 4; // Big bonus for having a counter
        }
    });
  });

  // Check if Red counters Blue
  redPicks.forEach(redChamp => {
    bluePicks.forEach(blueChamp => {
        if (redChamp.counters.includes(blueChamp.id)) {
            counterDelta -= 4; // Penalty if they counter us
        }
    });
  });

  // 3. Final Probability
  let blueWinProb = 50 + (blueScore - redScore) + counterDelta; 
  blueWinProb = Math.max(10, Math.min(90, blueWinProb));

  // 4. Insight Generation
  let insight = "Draft is even.";
  if (counterDelta > 5) insight = "Blue team has secured multiple hard counters, giving them a significant edge.";
  else if (counterDelta < -5) insight = "Red team has effectively countered Blue's composition.";
  else if (bluePicks.length > 0) insight = "Matchups are skill-dependent with no hard counters yet.";

  // 5. Identify Threats
  const threats: string[] = [];
  redPicks.forEach(redChamp => {
      let threatScore = 0;
      const countersBlue = bluePicks.some(b => redChamp.counters.includes(b.id));
      if (countersBlue) threatScore += 10;
      if (redStats[redChamp.id].winRate > 52) threatScore += 5;

      if (threatScore > 5) {
          threats.push(`${redChamp.name} ${countersBlue ? '(Counter Pick!)' : ''}`);
      }
  });

  return {
    blueWinProbability: Math.round(blueWinProb),
    strategicInsight: insight,
    opponentThreats: threats.slice(0, 3)
  };
};

export const getSmartRecommendations = async (
  slots: DraftSlot[], 
  activeSlot: DraftSlot | undefined,
  config: SimulationConfig
): Promise<Recommendation[]> => {
  
  // Filter out picked champions
  const usedIds = new Set(slots.filter(s => s.champion).map(s => s.champion!.id));
  const availableChampions = ALL_CHAMPIONS.filter(c => !usedIds.has(c.id));
  const stats = mockGridResponse(availableChampions.map(c => c.id));

  // CASE 1: No Active Slot - Return Global Highest Win Rate
  if (!activeSlot) {
     const sortedByWR = availableChampions
        .sort((a, b) => stats[b.id].winRate - stats[a.id].winRate)
        .slice(0, 3);
        
    return sortedByWR.map(c => ({
        championName: c.name,
        score: Math.round(stats[c.id].winRate),
        reasoning: `Highest available win rate (${Math.round(stats[c.id].winRate)}%) in current patch.`,
        type: 'comfort'
    }));
  }

  // CASE 2: Active Slot is FILLED - Return Counters to this specific champion
  if (activeSlot.champion) {
    const target = activeSlot.champion;
    // Find champions that explicitly list 'target.id' in their 'counters' array
    const specificCounters = availableChampions.filter(c => c.counters.includes(target.id));

    if (specificCounters.length > 0) {
        // Sort by winrate among counters
        specificCounters.sort((a, b) => stats[b.id].winRate - stats[a.id].winRate);
        
        return specificCounters.slice(0, 3).map(c => ({
            championName: c.name,
            score: 90 + Math.floor(Math.random() * 9), // High score for direct counters
            reasoning: `Direct counter to ${target.name} based on Grid data.`,
            type: 'counter'
        }));
    } else {
        // Fallback if no direct counters found
        return availableChampions
            .sort((a, b) => stats[b.id].winRate - stats[a.id].winRate)
            .slice(0, 3)
            .map(c => ({
                championName: c.name,
                score: Math.round(stats[c.id].winRate),
                reasoning: `No direct counter found for ${target.name}, but ${c.name} is a strong meta pick.`,
                type: 'comfort'
            }));
    }
  }

  // CASE 3: Active Slot is EMPTY - Smart Contextual Recommendation
  // (Counter existing enemies, avoid self-counters, find synergy)
  
  const myTeam = activeSlot.team;
  const enemyTeam = activeSlot.team === 'blue' ? 'red' : 'blue';
  
  const enemyPicks = slots
    .filter(s => s.team === enemyTeam && s.type === 'pick' && s.champion)
    .map(s => s.champion!);
    
  const myPicks = slots
    .filter(s => s.team === myTeam && s.type === 'pick' && s.champion)
    .map(s => s.champion!);

  const scoredChampions = availableChampions.map(champ => {
    let score = stats[champ.id].winRate; 
    let reason = "";
    let type: 'synergy' | 'counter' | 'comfort' = 'comfort';

    // A. Counter Enemy Picks
    const enemiesCountered = enemyPicks.filter(enemy => champ.counters.includes(enemy.id));
    
    if (enemiesCountered.length > 0) {
        score += 25 * enemiesCountered.length; 
        type = 'counter';
        reason = `Hard counter to ${enemiesCountered.map(e => e.name).join(', ')}.`;
    }

    // B. Avoid being Countered
    const counteredBy = enemyPicks.filter(enemy => enemy.counters.includes(champ.id));
    if (counteredBy.length > 0) {
        score -= 30; 
    }

    // C. Synergy
    if (activeSlot.type === 'pick') {
        const myTags = myPicks.flatMap(p => p.tags);
        if (myTags.includes('Engage') && champ.tags.includes('FollowUp')) score += 5;
        if (myTags.includes('Teamfight') && champ.tags.includes('Teamfight')) score += 3;
    }

    if (!reason) {
        reason = `Solid pick (${Math.round(stats[champ.id].winRate)}% WR).`;
    }

    return { champ, score, reason, type };
  });

  scoredChampions.sort((a, b) => b.score - a.score);

  return scoredChampions.slice(0, 3).map(item => ({
    championName: item.champ.name,
    score: Math.min(99, Math.round(item.score)),
    reasoning: item.reason,
    type: item.type
  }));
};
