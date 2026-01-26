
export enum DraftPhase {
  BLUE_BAN_1, RED_BAN_1, BLUE_BAN_2, RED_BAN_2, BLUE_BAN_3, RED_BAN_3,
  BLUE_PICK_1, RED_PICK_1, RED_PICK_2, BLUE_PICK_2, BLUE_PICK_3, RED_PICK_3,
  RED_BAN_4, BLUE_BAN_4, RED_BAN_5, BLUE_BAN_5,
  RED_PICK_4, BLUE_PICK_4, BLUE_PICK_5, RED_PICK_5,
  COMPLETE
}

export type Role = 'Top' | 'Jungle' | 'Mid' | 'Bot' | 'Support';

export interface Champion {
  id: string;
  name: string;
  roles: Role[];
  imgUrl?: string; // We will generate this dynamically
  tags: string[]; // e.g. 'EarlyGame', 'Teamfight', 'SplitPush', 'Engage', 'Disengage', 'Scaling'
  counters: string[]; // IDs of champions this champion is good against
}

export interface DraftSlot {
  phase: DraftPhase;
  team: 'blue' | 'red';
  type: 'pick' | 'ban';
  champion: Champion | null;
  isActive: boolean;
  originalIndex?: number; // Helper for UI mapping
}

export interface Recommendation {
  championName: string;
  score: number; // 0-100
  reasoning: string;
  type: 'synergy' | 'counter' | 'comfort';
}

export interface AnalysisResult {
  blueWinProbability: number;
  recommendations: Recommendation[];
  strategicInsight: string;
  opponentThreats: string[];
}

export interface SimulationConfig {
    opponentStyle: 'Aggressive' | 'Scaling' | 'Split Push' | 'Teamfight';
    patchVersion: string;
}

// New Types for Patch Data & Live Game
export interface PatchStats {
  championName: string;
  role: Role;
  winRate: number;
  pickRate: number;
  banRate: number;
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
}

export interface LiveGameResult {
  active: boolean;
  winner?: 'blue' | 'red';
  gameId?: string;
}

export type AppView = 'draft' | 'patch';
