
# RiftMind - AI LoL Draft Assistant (Python Engine Edition)

RiftMind is a professional-grade League of Legends drafting assistant. The core logic runs on a dedicated **Python Backend**, utilizing NumPy for synergy calculations and predictive modeling, while the frontend is a responsive React application.

## 🌟 Key Features

*   **Python Synergy Engine**: Calculates $S = \sum \omega(C_{i,j}) + \beta \log(P_{patch})$.
*   **Predictive Opponent Modeling**: Guesses the enemy's next move using probabilistic weights.
*   **Pocket Pick Alerts**: Flags "one-trick" champions that threaten your composition.
*   **Offline Fallback**: Seamlessly switches to local heuristics if the Python backend is unreachable.

---

## 💻 System Requirements

Before running RiftMind, ensure you have the following installed:

*   **Node.js**: v16.0.0 or higher
*   **npm**: v7.0.0 or higher
*   **Python**: v3.8 or higher
*   **pip**: Python package installer

---

## ⚙️ Configuration (.env)

To enable external data fetching (optional for demo, required for production), you must configure environment variables.

1.  Create a file named `.env` in the **project root** directory.
2.  Add the following keys:

```env
# (Optional) Key for GRID Esports Data API
REACT_APP_GRID_API_KEY=your_grid_api_key_here

# (Optional) Base URL if running Python backend on a different port/host
REACT_APP_API_URL=http://localhost:8000
```

> **Note:** If `REACT_APP_GRID_API_KEY` is omitted, the application will run in **Simulation Mode**, generating realistic mock data for all matches and patch stats.

---

## 🚀 Installation & Setup

### 1. Backend (The "Brain")

The Python backend handles the heavy lifting (math, predictions, synergy scores).

1.  Open a terminal in the project root.
2.  Install the required Python libraries:
    ```bash
    pip install fastapi uvicorn numpy pydantic
    ```
3.  Start the server:
    ```bash
    uvicorn backend.main:app --reload
    ```
    *   You should see: `Uvicorn running on http://127.0.0.1:8000`

### 2. Frontend (The "Face")

The React application visualizes the data.

1.  Open a **new** terminal window in the project root.
2.  Install Node dependencies:
    ```bash
    npm install
    ```
3.  Start the web application:
    ```bash
    npm start
    ```
    *   The app will open at `http://localhost:8000` (or similar port).

---

## 🧪 How to Test

You can verify the system is working by simulating a draft.

### Scenario A: Full AI Mode (Backend Running)
**Goal:** Verify the React app is communicating with the Python brain.

1.  Ensure the Python terminal is running (`uvicorn backend.main:app`).
2.  In the web app, click on a **Blue Team** pick slot and select a champion (e.g., "Ahri").
3.  **Visual Check:** 
    *   The **Win Probability Chart** should update.
    *   The **Predicted Next Picks** box (Purple box on the left) should populate with champions (e.g., "Maokai", "Vi").
4.  **Technical Check:**
    *   Open Browser DevTools (`F12` or Right Click -> Inspect).
    *   Go to the **Network** tab.
    *   Look for a request named `analyze`.
    *   Status should be **200 OK**.
    *   Click it and view the **Response**: You will see JSON data containing `blue_synergy_score` and `predictions`.

### Scenario B: Offline Fallback Mode
**Goal:** Verify the app doesn't crash if the backend server dies.

1.  **Stop the Python terminal** (Ctrl+C).
2.  In the web app, select another champion for the **Red Team**.
3.  **Visual Check:** 
    *   The app **does not crash**.
    *   The Win Probability chart still updates (using local math).
    *   The "Predicted Picks" might show "Offline Mode" or generic meta picks.
4.  **Technical Check:**
    *   Open Browser DevTools -> **Console**.
    *   You should see a warning: `RiftMind Backend unavailable. Switching to offline heuristic mode.`

---

## 📖 User Manual

### The Draft Board
*   **Blue Side (Left)**: Your team. Click slots to pick/ban.
*   **Red Side (Right)**: The opponent.
*   **Center**: 
    *   **Win Probability**: A live graph showing the tug-of-war of the draft.
    *   **Recommendations**: Click these to quickly select the best champion for the current slot.
    *   **Alerts**: Warnings about opponent power spikes or counter-picks appear here.

### Patch Data View
Click the **"Patch Data"** button in the header to view the current meta stats (Tier list, Win Rates) powered by the simulated GRID API data.

## 📄 License

MIT License
