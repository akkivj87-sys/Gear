import React, { useState } from 'react';
import { Crown, Play, Trophy, Sparkles, Check, ChevronRight } from 'lucide-react';
import { CHARACTERS, CharacterArchetype } from '../game/config/Characters';
import { LEVELS, LevelDefinition } from '../game/level/LevelData';

interface CharacterSelectModalProps {
  onStartGame: (archetypeId: string, levelId: string) => void;
  defaultArchetypeId?: string;
  defaultLevelId?: string;
}

const HERO_IMAGE_URL = '/public/assets/aistudio/file_000000003b048208b6bf0699c05c7595_a8eda307.png';

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  onStartGame,
  defaultArchetypeId = 'rebel',
  defaultLevelId = 'level_1',
}) => {
  const [selectedArchetype, setSelectedArchetype] = useState(defaultArchetypeId);
  const [selectedLevel, setSelectedLevel] = useState(defaultLevelId);

  const activeChar = CHARACTERS.find((c) => c.id === selectedArchetype) || CHARACTERS[0];
  const activeLvl = LEVELS.find((l) => l.id === selectedLevel) || LEVELS[0];

  return (
    <div className="absolute inset-0 z-50 bg-[#090b10] flex flex-col justify-start items-center p-3 md:p-6 select-none overflow-y-auto">
      <div className="max-w-6xl w-full flex flex-col items-center">
        {/* Cinematic Hero Artwork Header Banner */}
        <div className="relative w-full h-44 sm:h-56 md:h-72 rounded-2xl overflow-hidden border border-white/20 shadow-2xl mb-6 group">
          <img
            src={HERO_IMAGE_URL}
            alt="Apex Flow Parkour Specialists"
            className="w-full h-full object-cover object-top filter brightness-95 contrast-105 transform group-hover:scale-102 transition duration-700"
          />
          {/* Subtle gradient vignettes for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b10] via-black/30 to-black/60 flex flex-col justify-between p-4 md:p-6">
            <div className="flex justify-between items-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-widest backdrop-blur-md">
                <Sparkles size={13} /> Official Specialist Roster
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-white/70 bg-black/50 px-2.5 py-1 rounded border border-white/10 backdrop-blur-md">
                Crown Athletic Collective
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-wider drop-shadow-md">
                Select Parkour Specialist
              </h1>
              <p className="text-amber-400 text-xs md:text-sm uppercase tracking-widest font-bold drop-shadow">
                Choose your athletic archetype & master the rooftop skyline
              </p>
            </div>
          </div>
        </div>

        {/* Character Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-6">
          {CHARACTERS.map((char) => {
            const isSelected = selectedArchetype === char.id;
            return (
              <div
                key={char.id}
                onClick={() => setSelectedArchetype(char.id)}
                className={`relative rounded-xl p-4 md:p-5 cursor-pointer flex flex-col justify-between transition-all duration-200 border-2 ${
                  isSelected
                    ? 'border-amber-500 bg-slate-800/95 -translate-y-1.5 shadow-[0_10px_25px_rgba(255,153,0,0.35)] ring-1 ring-amber-400/50'
                    : 'border-white/10 bg-slate-900/80 hover:border-white/30 hover:bg-slate-800/70'
                }`}
              >
                <div>
                  {/* Top Crown & Role Tag */}
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Crown
                        size={18}
                        className={isSelected ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}
                      />
                      <span className="text-xs font-black tracking-wider text-white">👑</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      ({char.role})
                    </span>
                  </div>

                  {/* Character Name */}
                  <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-wide">
                    {char.name}
                  </h3>

                  {/* Handwritten Traits List from Reference Image */}
                  <div className="my-2 bg-black/40 rounded-lg p-2 border border-white/5 flex flex-wrap gap-1">
                    {char.traits.map((trait, tIdx) => (
                      <span
                        key={tIdx}
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {trait}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {char.description}
                  </p>
                </div>

                {/* Stat Display Box */}
                <div className="border-t border-white/10 pt-3 flex flex-col gap-1">
                  <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase flex justify-between">
                    <span>{char.statsDisplay.speed}</span>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex justify-between">
                    <span>{char.statsDisplay.special}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Specialist Highlight Box & Sector Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
          {/* Active Specialist Summary */}
          <div className="md:col-span-1 bg-slate-900/85 border border-white/15 rounded-xl p-4 flex flex-col justify-between backdrop-blur-md">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Selected Specialist
              </div>
              <div className="text-lg font-black text-amber-400 uppercase flex items-center gap-2">
                {activeChar.name} <span className="text-xs text-white">({activeChar.role})</span>
              </div>
              <div className="text-xs text-slate-300 italic mt-1 font-serif">
                "{activeChar.tagline}"
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs text-slate-400">
              <span>Speed Boost: <strong className="text-white">{Math.round(activeChar.modifiers.speedMultiplier * 100)}%</strong></span>
              <span>Wall-Run: <strong className="text-amber-400">{Math.round(activeChar.modifiers.wallRunBonus * 100)}%</strong></span>
            </div>
          </div>

          {/* Level Sector Selection */}
          <div className="md:col-span-2 bg-slate-900/85 border border-white/15 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Trophy size={14} className="text-amber-400" /> Target Rooftop Sector:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {LEVELS.map((lvl) => {
                  const isLvlSelected = selectedLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                        isLvlSelected
                          ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-lg'
                          : 'border-white/10 bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                          {lvl.difficulty}
                        </div>
                        <div className="text-xs font-bold text-white uppercase truncate">
                          {lvl.name}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-2">
                        Par: {lvl.parTime}s • {lvl.checkpoints.length} CPs
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Start Game Action Button */}
        <button
          onClick={() => onStartGame(selectedArchetype, selectedLevel)}
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black px-14 py-4 rounded-full font-black text-lg md:text-xl uppercase tracking-widest shadow-[0_6px_30px_rgba(255,153,0,0.55)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3"
        >
          <Play size={24} className="fill-black" /> Deploy To Sector
        </button>

        {/* Keyboard Controls Guide */}
        <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
          <span><strong className="text-white">WASD:</strong> Move / Sprint</span>
          <span><strong className="text-white">SPACE:</strong> Jump / Double Jump</span>
          <span><strong className="text-white">C:</strong> Slide / Roll on Drop</span>
          <span><strong className="text-white">SHIFT:</strong> Wall-Run Adhesion</span>
          <span><strong className="text-white">E / CLICK:</strong> Grapple Hook</span>
          <span><strong className="text-white">V:</strong> 1st/3rd Person</span>
          <span><strong className="text-white">R:</strong> Respawn Checkpoint</span>
        </div>
      </div>
    </div>
  );
};
