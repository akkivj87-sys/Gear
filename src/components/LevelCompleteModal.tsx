import React from 'react';
import { Trophy, ArrowRight, RotateCcw, Home, Sparkles, Star } from 'lucide-react';

interface LevelCompleteModalProps {
  levelName: string;
  timeString: string;
  score: number;
  collectibles: number;
  totalCollectibles: number;
  isNewBest: boolean;
  nextLevelId: string | null;
  onNextLevel: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  levelName,
  timeString,
  score,
  collectibles,
  totalCollectibles,
  isNewBest,
  nextLevelId,
  onNextLevel,
  onRestart,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-center items-center p-4 select-none">
      <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(255,153,0,0.35)] flex flex-col items-center text-center gap-5">
        {/* Victory Trophy Icon */}
        <div className="relative">
          <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-2xl">
            <Trophy size={36} className="text-black fill-black" />
          </div>
          {isNewBest && (
            <div className="absolute -top-2 -right-4 bg-cyan-400 text-black text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
              <Sparkles size={11} /> New PB!
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
            Sector Cleared!
          </h2>
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-0.5">
            {levelName}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-slate-800/80 border border-white/10 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Clear Time
            </span>
            <span className="text-xl md:text-2xl font-black font-mono text-cyan-400 mt-0.5">
              {timeString}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-white/10 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Total Score
            </span>
            <span className="text-xl md:text-2xl font-black font-mono text-amber-400 mt-0.5">
              {score}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-white/10 rounded-xl p-3 col-span-2 flex justify-between items-center px-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Star size={15} className="text-yellow-400 fill-yellow-400" /> Collectibles:
            </span>
            <span className="text-sm font-mono font-bold text-white">
              {collectibles} / {totalCollectibles} Found
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-2">
          {nextLevelId ? (
            <button
              onClick={onNextLevel}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-black py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition cursor-pointer active:scale-98"
            >
              Advance To Next Sector <ArrowRight size={18} />
            </button>
          ) : (
            <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest py-2 bg-emerald-950/60 rounded-xl border border-emerald-500/30">
              🏆 Apex Spire Conquered! All Sectors Complete!
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={onRestart}
              className="bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-white/10 transition cursor-pointer active:scale-98"
            >
              <RotateCcw size={14} /> Retry Sector
            </button>

            <button
              onClick={onMainMenu}
              className="bg-slate-800 hover:bg-slate-700 text-amber-400 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-amber-500/20 transition cursor-pointer active:scale-98"
            >
              <Home size={14} /> Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
