import React from 'react';
import { DraftSlot as IDraftSlot } from '../types';
import { getChampionAssets } from '../constants';

interface Props {
  slot: IDraftSlot;
  onClick: (e: React.MouseEvent) => void;
  onClear: (e: React.MouseEvent) => void;
}

const DraftSlot: React.FC<Props> = ({ slot, onClick, onClear }) => {
  const isPick = slot.type === 'pick';
  const isBlue = slot.team === 'blue';
  
  const baseClasses = "relative flex items-center justify-center transition-all duration-300 border-2 cursor-pointer overflow-hidden group";
  const sizeClasses = isPick ? "w-20 h-20 md:w-24 md:h-24" : "w-12 h-12 md:w-16 md:h-16";
  
  let borderColor = "border-gray-800";
  // Active state now means "Selected for Editing"
  if (slot.isActive) borderColor = "border-hex-gold shadow-[0_0_15px_#C8AA6E]";
  else if (slot.champion) borderColor = isBlue ? "border-hex-blue" : "border-red-500";
  else borderColor = "border-gray-800 opacity-60 hover:opacity-100 hover:border-gray-600";

  const assets = slot.champion ? getChampionAssets(slot.champion.id) : null;

  return (
    <div 
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${borderColor} bg-gray-900 rounded-md`}
    >
      {slot.champion && assets ? (
        <>
          <img 
            src={assets.square}
            alt={slot.champion.name} 
            className="absolute inset-0 w-full h-full object-cover opacity-80" 
          />
           <div className="z-10 text-[10px] font-bold text-center text-white drop-shadow-md p-0.5 bg-black/60 w-full absolute bottom-0">
             {slot.champion.name}
           </div>
           
           {/* Clear Button (Visible on Hover) */}
           <button 
             onClick={onClear}
             className="absolute top-1 right-1 z-20 bg-black/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
             title="Remove Champion"
           >
             &times;
           </button>
        </>
      ) : (
        <span className={`text-gray-600 text-[10px] md:text-xs font-mono uppercase tracking-widest text-center ${slot.isActive ? 'text-hex-gold animate-pulse' : ''}`}>
          {slot.isActive ? 'SELECT' : slot.type}
        </span>
      )}
    </div>
  );
};

export default DraftSlot;