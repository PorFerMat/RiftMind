
import math
import random
import numpy as np

# Mock Database of Champion Stats (In production, this comes from GRID/Pandas)
CHAMPION_STATS = {
    "Aatrox": {"roles": ["Top"], "patch_pick_rate": 0.12, "win_rate": 0.51},
    "Ahri": {"roles": ["Mid"], "patch_pick_rate": 0.15, "win_rate": 0.49},
    "LeeSin": {"roles": ["Jungle"], "patch_pick_rate": 0.20, "win_rate": 0.48},
    "Thresh": {"roles": ["Support"], "patch_pick_rate": 0.10, "win_rate": 0.50},
    "Jinx": {"roles": ["Bot"], "patch_pick_rate": 0.18, "win_rate": 0.52},
    # Fallback for others to avoid key errors in demo
}

class RiftMindEngine:
    def __init__(self):
        # Weights for the formula
        self.BETA_PATCH_WEIGHT = 5.0
        self.OMEGA_PROFICIENCY = 1.2

    def _get_stat(self, champ_id, key, default=0.05):
        return CHAMPION_STATS.get(champ_id, {}).get(key, default)

    def calculate_synergy_index(self, team_picks):
        """
        Implements S = Sum(w(Ci,j)) + B * log(P_patch)
        """
        if not team_picks:
            return 0

        # 1. P_patch (Patch Relevance)
        # Average pick rate of the composition
        avg_pick_rate = sum([self._get_stat(c, "patch_pick_rate") for c in team_picks]) / len(team_picks)
        # Avoid log(0)
        p_patch_score = self.BETA_PATCH_WEIGHT * math.log(max(avg_pick_rate, 0.01) * 100)

        # 2. C_i,j (Synergy Matrix)
        # We simulate a synergy matrix score. In real life, this is a vector dot product.
        # For the demo, we award points for role diversity.
        roles_covered = set()
        synergy_sum = 0
        
        for char in team_picks:
            # Simple simulation: specific pairs get bonuses
            if char == "Yasuo" and "Malphite" in team_picks: synergy_sum += 15
            if char == "Lulu" and "Jinx" in team_picks: synergy_sum += 12
            if char == "Xayah" and "Rakan" in team_picks: synergy_sum += 20
            
            # Proficiency weight (omega)
            synergy_sum *= self.OMEGA_PROFICIENCY

        # Normalize to 0-100 scale roughly
        total_s = 50 + p_patch_score + synergy_sum
        return round(min(100, max(0, total_s)), 1)

    def calculate_win_probability(self, blue_picks, red_picks, blue_syn, red_syn):
        """
        Forecasting model based on synergy delta and historical win rates.
        """
        base_prob = 50.0
        
        # 1. Synergy Delta
        syn_diff = (blue_syn - red_syn) * 0.3
        
        # 2. Raw Winrate Delta
        blue_avg_wr = sum([self._get_stat(c, "win_rate", 0.50) for c in blue_picks]) / max(1, len(blue_picks))
        red_avg_wr = sum([self._get_stat(c, "win_rate", 0.50) for c in red_picks]) / max(1, len(red_picks))
        
        wr_diff = (blue_avg_wr - red_avg_wr) * 100 * 2 # Weight factor
        
        final_prob = base_prob + syn_diff + wr_diff
        return round(min(99, max(1, final_prob)), 1)

    def predict_next_pick(self, blue_picks, red_picks, bans, next_team):
        """
        Predictive Opponent Modeling.
        Guesses what the enemy will take based on what roles they are missing.
        """
        enemy_picks = red_picks if next_team == "blue" else blue_picks
        taken_champs = set(blue_picks + red_picks + bans)
        
        # Simple Logic: What roles are missing?
        # (This would be a transformer/GRU in the full commercial version)
        needed_roles = {"Top", "Jungle", "Mid", "Bot", "Support"}
        
        # Remove roles they likely have (simulated)
        if len(enemy_picks) > 0:
            # Just randomly remove a role to simulate logic for the demo
            if len(enemy_picks) == 1: needed_roles.remove("Bot")
            if len(enemy_picks) == 2: needed_roles.discard("Support")
        
        # Return plausible candidates
        candidates = []
        possible = ["Maokai", "Sejuani", "Azir", "Varus", "Nautilus", "Renekton", "Vi"]
        
        for p in possible:
            if p not in taken_champs:
                confidence = random.randint(60, 95)
                candidates.append({
                    "champion": p,
                    "confidence": confidence,
                    "reason": "Fills missing role & High Meta Prio"
                })
        
        return sorted(candidates, key=lambda x: x['confidence'], reverse=True)[:2]

    def check_pocket_picks(self, enemy_team_picks):
        """
        Pocket Pick Alerts: Flags 'One-Trick' off-meta threats.
        """
        alerts = []
        # Mock database of pro player known pocket picks
        known_pockets = ["Draven", "Bard", "Riven", "Nidalee"]
        
        for pick in enemy_team_picks:
            if pick in known_pockets:
                alerts.append({
                    "champion": pick,
                    "type": "ONE-TRICK ALERT",
                    "message": f"Opponent has 80% WR on {pick} in SoloQ. Respect ban required next game."
                })
        
        # Randomly generate an alert for demo if empty
        if not alerts and len(enemy_team_picks) > 1:
             alerts.append({
                "champion": enemy_team_picks[0],
                "type": "MASTERY ALERT",
                "message": f"Player proficiency on {enemy_team_picks[0]} is in top 1%."
            })
            
        return alerts
