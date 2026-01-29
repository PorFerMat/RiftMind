
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from riftmind_engine import RiftMindEngine
import time

app = FastAPI()

# Enable CORS for the React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = RiftMindEngine()

class Champion(BaseModel):
    id: str
    name: str 
    roles: List[str]

class DraftState(BaseModel):
    blue_picks: List[str] # List of Champion IDs
    red_picks: List[str]
    blue_bans: List[str]
    red_bans: List[str]

@app.get("/")
def read_root():
    return {"status": "RiftMind Core Online"}

@app.post("/analyze")
def analyze_draft(state: DraftState):
    """
    Main endpoint called by frontend every time a pick is made.
    Returns: Win Prob, Synergy Scores, Next Predictions, and Alerts.
    """
    start_time = time.time()
    
    # LOGGING: This prints to the Terminal 1 window so the user sees it working
    print(f"[{time.strftime('%X')}] 🧠 Processing Draft...")
    print(f"   Blue Team: {state.blue_picks}")
    print(f"   Red Team:  {state.red_picks}")
    
    # 1. Calculate Synergy Index (S)
    blue_synergy = engine.calculate_synergy_index(state.blue_picks)
    red_synergy = engine.calculate_synergy_index(state.red_picks)
    
    # 2. Calculate Win Probability
    # Base 50% + Synergy Diff + Counter Weights
    win_prob = engine.calculate_win_probability(state.blue_picks, state.red_picks, blue_synergy, red_synergy)
    
    # 3. Predictive Modeling (Next Pick Guess)
    # Determine whose turn it is roughly based on counts
    total_picks = len(state.blue_picks) + len(state.red_picks)
    next_team = "blue" if total_picks % 2 == 0 else "red" # Simplified turn logic
    predicted_picks = engine.predict_next_pick(state.blue_picks, state.red_picks, state.blue_bans + state.red_bans, next_team)

    # 4. Pocket Pick Alerts
    alerts = engine.check_pocket_picks(state.red_picks if next_team == "blue" else state.blue_picks)

    process_time = round((time.time() - start_time) * 1000, 2)
    print(f"✅ Analysis Complete ({process_time}ms). Win Probability: {win_prob}%")
    print("-" * 30)

    return {
        "blue_win_probability": win_prob,
        "blue_synergy_score": blue_synergy,
        "red_synergy_score": red_synergy,
        "predictions": predicted_picks,
        "alerts": alerts
    }
