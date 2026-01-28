
import { DraftSlot, SimulationConfig } from "../types";
import { getHeuristicAnalysis } from "./gridService"; // Import local logic for fallback

const API_URL = "http://localhost:8000";

export interface AnalysisResponse {
  blue_win_probability: number;
  blue_synergy_score: number;
  red_synergy_score: number;
  predictions: {
    champion: string;
    confidence: number;
    reason: string;
  }[];
  alerts: {
    champion: string;
    type: string;
    message: string;
  }[];
}

export const fetchAnalysis = async (slots: DraftSlot[]): Promise<AnalysisResponse> => {
    try {
        const blue_picks = slots.filter(s => s.team === 'blue' && s.type === 'pick' && s.champion).map(s => s.champion!.id);
        const red_picks = slots.filter(s => s.team === 'red' && s.type === 'pick' && s.champion).map(s => s.champion!.id);
        const blue_bans = slots.filter(s => s.team === 'blue' && s.type === 'ban' && s.champion).map(s => s.champion!.id);
        const red_bans = slots.filter(s => s.team === 'red' && s.type === 'ban' && s.champion).map(s => s.champion!.id);

        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                blue_picks,
                red_picks,
                blue_bans,
                red_bans
            })
        });

        if (!response.ok) {
            throw new Error("Backend not reachable");
        }

        return await response.json();
    } catch (error) {
        console.warn("RiftMind Backend unavailable. Switching to offline heuristic mode.");
        
        // --- FALLBACK: CLIENT-SIDE CALCULATION ---
        // We use the existing logic in gridService to approximate the Python engine
        const config: SimulationConfig = { opponentStyle: 'Teamfight', patchVersion: '14.2' };
        const localAnalysis = getHeuristicAnalysis(slots, config);
        
        // Generate pseudo-predictions for the fallback so UI doesn't break
        const predictions = [];
        if (slots.some(s => s.champion)) {
             predictions.push(
                 { champion: "Maokai", confidence: 75, reason: "Offline Mode: Meta Tank" },
                 { champion: "Varus", confidence: 60, reason: "Offline Mode: Flex Pick" }
             );
        }

        // Map local threats to alerts format
        const alerts = localAnalysis.opponentThreats.map(t => ({
            champion: t.split(' ')[0], // Extract name
            type: "THREAT",
            message: t
        }));

        return {
            blue_win_probability: localAnalysis.blueWinProbability,
            // Create synthetic synergy scores from win probability
            blue_synergy_score: Math.round(localAnalysis.blueWinProbability * 0.8), 
            red_synergy_score: Math.round((100 - localAnalysis.blueWinProbability) * 0.8),
            predictions: predictions,
            alerts: alerts
        };
    }
};
