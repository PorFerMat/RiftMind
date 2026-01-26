import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ArchitectureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-hex-dark w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-hex-gold shadow-2xl">
        <div className="sticky top-0 bg-hex-dark/95 border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-hex-gold">RiftMind: System Architecture</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>
        
        <div className="p-8 space-y-8 text-gray-300">
          
          <section>
            <h3 className="text-xl font-bold text-white mb-3">1. Technical Approach</h3>
            <p className="mb-2">
              <strong>Hybrid Neuro-Symbolic Model:</strong> We recommend a hybrid approach combining a 
              <strong> Transformer-based Sequence Model</strong> (like GPT architecture adapted for draft sequences) for intuition and pattern recognition, 
              paired with a <strong>Constraint Satisfaction Engine</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
              <li><strong>Why Transformer?</strong> Drafting is sequential. The meaning of a pick depends heavily on previous picks. Transformers excel at attending to the entire context window (current draft state) to predict the next token (champion).</li>
              <li><strong>Why Symbolic Constraints?</strong> Pure deep learning models can hallucinate invalid compositions. A rules-based layer filters output for validity (e.g., "Must pick Top laner").</li>
              <li><strong>Inference:</strong> We leverage the Gemini API as a proxy for this reasoning engine in this prototype to simulate high-level strategic analysis.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">2. Data Pipeline Blueprint</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h4 className="font-bold text-hex-blue mb-2">Ingestion (GRID API)</h4>
                <p className="text-xs">Raw JSON matches → ETL Process → Data Lake. Specifically parsing `live_frames` for game state and `setup` for drafts.</p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                <h4 className="font-bold text-hex-blue mb-2">State Representation</h4>
                <p className="text-xs">
                  Vector embedding of size [N_Champs + N_Roles].
                  Draft State Tensor: `[Turn_Number, Blue_Picks_OneHot, Red_Picks_OneHot, Bans_OneHot]`
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">3. Feature Engineering</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-hex-gold font-mono">CC_Density:</span> 
                Sum of Hard CC duration in current composition.
              </li>
              <li className="flex gap-2">
                <span className="text-hex-gold font-mono">Power_Spike_Delta:</span> 
                Difference in average gold efficiency at 15/25/35 min between teams.
              </li>
              <li className="flex gap-2">
                <span className="text-hex-gold font-mono">Dmg_Profile_Mix:</span> 
                Ratio of Physical vs. Magic damage (to predict armor/mr stacking efficiency).
              </li>
              <li className="flex gap-2">
                <span className="text-hex-gold font-mono">WinRate_@_Patch:</span> 
                Weighted average win rate of picked champions on current patch version.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">4. Training Strategy</h3>
            <p className="mb-2"><strong>Offline RL (Reinforcement Learning):</strong></p>
            <p className="text-sm text-gray-400 mb-2">Instead of simple Supervised Learning (predicting what humans did), we treat drafting as a game.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
              <li><strong>State:</strong> Current Picks/Bans.</li>
              <li><strong>Action:</strong> Picking/Banning a champion.</li>
              <li><strong>Reward:</strong> +1 for Win, -1 for Loss. Weighted by GD@15 to encourage winning early game states.</li>
              <li><strong>Algorithm:</strong> Conservative Q-Learning (CQL) to avoid overestimating out-of-distribution drafts.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-3">5. Security & Deployment</h3>
            <p className="text-sm text-gray-400">
              The GRID API Key provided (`aRkq...`) must <strong>never</strong> be used on the client-side. 
              The production architecture utilizes a secure Node.js middleware to proxy requests to GRID, caching champion stats in Redis to minimize API costs and latency.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ArchitectureModal;