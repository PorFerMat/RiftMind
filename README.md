
# RiftMind - GRID Edition (AI Draft Assistant)

RiftMind is a professional-grade League of Legends drafting assistant powered by AI and GRID Data. It provides real-time win probability analysis, counter-pick recommendations, and opponent threat modeling.

## 🌟 Key Features

*   **Live Draft Board**: Interactive Ban/Pick slots for Blue and Red teams.
*   **Contextual Recommendations**:
    *   **Counters**: Suggests champions that hard-counter enemy picks.
    *   **Synergy**: Suggests champions that fit your current composition.
    *   **Global Meta**: Shows highest win-rate champions when slots are empty.
*   **Live Game Integration**:
    *   Connects to GRID Live Data Feed.
    *   Automatically updates Series Scoreboard (Win/Loss).
    *   Resets the draft board automatically upon game completion.
*   **Patch Data Hub**: Dedicated view for current patch statistics (Win Rate, Pick Rate, Ban Rate, Tier Lists).

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18+)
*   NPM or Yarn

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Setup (Security)**:
    *   Create a file named `.env` in the root directory.
    *   Add your GRID API Key:
        ```
        REACT_APP_GRID_API_KEY=your_actual_api_key_here
        ```
    *   **Note**: Ensure `.env` is added to your `.gitignore` file to prevent leaking credentials.

4.  Start the development server:
    ```bash
    npm run build
    ```
    ```bash
    npm start
    ```
    

## 🔌 GRID API Configuration

This application integrates with the GRID Data Platform for live match stats and patch data.

**Important Security Note:**
This repository uses environment variables to handle sensitive keys. Do not hardcode keys in `services/gridService.ts`.

### Live Game Simulation (Dev Mode)

Since live games are not always running during development, the app includes a **Dev Simulation Mode**:

1.  In the "Draft Insight" box (bottom left of the Draft view), hover over the text.
2.  You will see hidden "DEV: Simulate End" buttons.
3.  Click "Blue Win" or "Red Win" to test the Scoreboard update and Auto-Reset functionality.

## 🛠 Project Structure

*   `src/App.tsx`: Main application controller (State, Navigation, Reset Logic).
*   `src/components/`: UI components (DraftSlot, PatchDataView, Charts).
*   `src/services/gridService.ts`: Integration layer for GRID API.
*   `src/constants.ts`: Static champion data and asset mapping.

## 📄 License

**OSI Approved Open Source License**: MIT License

Copyright (c) 2024 RiftMind Developers

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
