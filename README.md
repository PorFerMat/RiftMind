
# RiftMind - AI LoL Draft Assistant (Python Engine)

RiftMind is a professional-grade League of Legends drafting assistant. It uses a **local Python backend** for mathematical synergy calculations and predictive modeling, paired with a React frontend.

---

## 🛠️ System Requirements (Everything you need)

Before running the app, ensure you have the following installed on your machine:

1.  **Node.js**: (Version 16 or higher). [Download Here](https://nodejs.org/)
2.  **npm**: Comes installed with Node.js.
3.  **Python**: (Version 3.8 or higher). [Download Here](https://www.python.org/)
4.  **pip**: Comes installed with Python.

---

## 🔑 Configuration & API Keys

To connect to external data sources (like GRID Esports) and avoid hardcoded keys in your code, you must configure the environment.

### 1. Create the Environment File
Create a new file named `.env` in the **root directory** of the project (the same folder as this README).

### 2. Add your Keys
Open the `.env` file and paste the following:

```env
# The URL for your Python Backend (Default is localhost:8000)
REACT_APP_API_URL=http://localhost:8000

# (Optional) Your GRID Esports API Key for live match data
# If you don't have one, the app uses a built-in simulation.
REACT_APP_GRID_API_KEY=your_actual_grid_api_key_here
```

**Note:** If you do not provide a `REACT_APP_GRID_API_KEY`, the application will automatically run in **Simulation Mode** (generating mock data for patch stats and live game status).

---

## 🚀 Step-by-Step Run Instructions

You need **two separate terminal windows** open simultaneously.

### Terminal 1: The Python Backend (The Brain)
1.  Open terminal at project root.
2.  Install Python dependencies:
    ```bash
    pip install fastapi uvicorn numpy pydantic
    ```
3.  Start the server:
    ```bash
    uvicorn backend.main:app --reload
    ```
4.  **Success:** You see `Uvicorn running on http://127.0.0.1:8000`.

### Terminal 2: The Frontend (The Interface)
1.  Open a NEW terminal at project root.
2.  Install JS dependencies:
    ```bash
    npm install
    ```
3.  Start the web app:
    ```bash
    npm start
    ```
4.  **Success:** Browser opens `http://localhost:3000`.

---

## ❓ How It Works: Win/Loss Detection

You asked: *"How can it check if the game ends with a win or lose?"*

RiftMind uses a **Polling Mechanism**.

1.  **The Loop:** Every 5 seconds, the Frontend (`App.tsx`) calls the function `checkLiveGameStatus()` located in `services/gridService.ts`.
2.  **The API Call:**
    *   **In Production:** This function sends a request to the GRID Esports API (e.g., `https://api.grid.gg/...`) using the key from your `.env` file.
    *   **The Response:** The API returns a JSON object describing the current game state. If the game is over, it returns a field like `winner: "blue"`.
3.  **The Reaction:**
    *   The App detects `active: false` and `winner: "blue"`.
    *   It triggers an animation ("BLUE VICTORY").
    *   It increments the score counter on the dashboard.
    *   It resets the draft board for the next game.

**Testing Win/Loss Locally:**
Since you might not have a live pro game running right now, the file `services/gridService.ts` contains a **Simulation** block. You can manually change the return value in that file to `{ active: false, winner: 'blue' }` to instantly trigger the "Victory" screen for testing.

---

## 📂 Project Structure

*   `backend/` - Python Logic (Math, Predictions).
*   `src/` - React Frontend.
    *   `services/api.ts` - Connects React to Python.
    *   `services/gridService.ts` - Connects React to GRID (Live Data).
*   `.env` - Stores your API keys securely.

## 📄 License

MIT License
