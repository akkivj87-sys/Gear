import React from 'react';
import { Play, RotateCcw, Settings, Home, Ghost } from 'lucide-react';
import { LEVELS } from '../game/level/LevelData';

interface PauseModalProps {
  currentLevelId: string;
  ghostEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onSelectLevel: (lvlId: string) => void;
  onOpenSettings: () => void;
  onToggleGhost: () => void;
  onOpenCharacterSelect: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  currentLevelId,
  ghostEnabled,
  onResume,
  onRestart,
  onSelectLevel,
  onOpenSettings,
  onToggleGhost,
  onOpenCharacterSelect,
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-center items-center p-4 select-none">
      <div className="max-w-md w-full bg-slate-900/90 border border-white/15 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            Game Paused
          </h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">
            Rooftop Parkour: Apex Flow
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-98"
          >
            <Play size={18} className="fill-black" /> Resume Run
          </button>

          <button
            onClick={onRestart}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition cursor-pointer active:scale-98"
          >
            <RotateCcw size={16} /> Restart Level
          </button>

          <button
            onClick={onOpenCharacterSelect}
            className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-amber-500/30 transition cursor-pointer active:scale-98"
          >
            <Home size={16} /> Change Specialist / Main Menu
          </button>
        </div>

        {/* Level Select */}
        <div className="border-t border-white/10 pt-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Switch Sector:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => onSelectLevel(lvl.id)}
                className={`p-2 rounded-lg border text-center text-xs font-bold uppercase transition cursor-pointer ${
                  currentLevelId === lvl.id
                    ? 'border-cyan-400 bg-cyan-950/60 text-white'
                    : 'border-white/10 bg-slate-800/40 text-slate-400 hover:text-white'
                }`}
              >
                {lvl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Utility Toggles */}
        <div className="border-t border-white/10 pt-3 flex justify-between items-center">
          <button
            onClick={onToggleGhost}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              ghostEnabled
                ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300'
                : 'border-white/10 text-slate-400 bg-slate-800/30'
            }`}
          >
            <Ghost size={14} /> Ghost Replay: {ghostEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800/60 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Settings size={14} /> Settings
          </button>
        </div>
      </div>
    </div>
  );
};
