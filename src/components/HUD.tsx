import React, { useEffect, useState, useRef } from 'react';
import { Camera, Eye, Zap, Anchor, RotateCcw, Pause, Crosshair, BookOpen, Navigation } from 'lucide-react';
import { CharacterArchetype } from '../game/config/Characters';

interface HUDProps {
  checkpoints: number;
  totalCheckpoints: number;
  timerString: string;
  speed: number;
  momentum: number;
  comboCount: number;
  playerState: string;
  character: CharacterArchetype;
  comboMessage: string;
  isFirstPerson: boolean;
  grappleAvailable: boolean;
  grappleLocked: boolean;
  grappleDistance: number | null;
  nextCheckpointDistance: number;
  nextCheckpointAngle: number;
  onToggleView: () => void;
  onRespawn: () => void;
  onPause: () => void;
  onOpenMoveBook: () => void;
  onPointerLockRequest: () => void;
  isPointerLocked: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  checkpoints,
  totalCheckpoints,
  timerString,
  speed,
  momentum,
  comboCount,
  playerState,
  character,
  comboMessage,
  isFirstPerson,
  grappleAvailable,
  grappleLocked,
  grappleDistance,
  nextCheckpointDistance,
  nextCheckpointAngle,
  onToggleView,
  onRespawn,
  onPause,
  onOpenMoveBook,
  onPointerLockRequest,
  isPointerLocked,
}) => {
  const [toastVisible, setToastVisible] = useState(false);
  const [activeToast, setActiveToast] = useState('');
  const toastTimeoutRef = useRef<number | null>(null);

  // Speed lines canvas ref
  const speedLinesCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (comboMessage) {
      setActiveToast(comboMessage);
      setToastVisible(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = window.setTimeout(() => {
        setToastVisible(false);
      }, 1400);
    }
  }, [comboMessage]);

  // Render high-speed radial motion streaks
  useEffect(() => {
    const canvas = speedLinesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderSpeedLines = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only draw motion lines when moving fast (> 13.5 m/s)
      if (speed > 13.5) {
        const intensity = Math.min(1.0, (speed - 13.5) / 10.0);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const numLines = Math.floor(18 + intensity * 26);

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.14 * intensity})`;
        ctx.lineWidth = 1.5;

        for (let i = 0; i < numLines; i++) {
          const angle = Math.random() * Math.PI * 2;
          const startR = Math.min(cx, cy) * (0.55 + Math.random() * 0.2);
          const endR = Math.max(cx, cy) * 1.15;

          const x1 = cx + Math.cos(angle) * startR;
          const y1 = cy + Math.sin(angle) * startR;
          const x2 = cx + Math.cos(angle) * endR;
          const y2 = cy + Math.sin(angle) * endR;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(renderSpeedLines);
    };

    animId = requestAnimationFrame(renderSpeedLines);
    return () => cancelAnimationFrame(animId);
  }, [speed]);

  // Compass marker horizontal offset (-80px to +80px)
  const compassOffset = Math.max(-90, Math.min(90, (nextCheckpointAngle / Math.PI) * 180));

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between select-none">
      {/* High Speed Motion Lines Overlay */}
      <canvas
        ref={speedLinesCanvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Top HUD Row */}
      <div className="flex justify-between items-start p-4 md:p-6 pointer-events-auto">
        {/* Left: Checkpoints Badge */}
        <div className="bg-slate-900/85 border-l-4 border-amber-500 rounded-lg px-4 py-2.5 text-white shadow-xl backdrop-blur-md">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
            Checkpoints
          </div>
          <div className="text-xl md:text-2xl font-black tracking-wider">
            {checkpoints} / {totalCheckpoints}
          </div>
        </div>

        {/* Center: Live Timer + Objective Compass Bar */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="bg-slate-900/85 border-l-4 border-cyan-400 rounded-lg px-6 py-2.5 text-white shadow-xl backdrop-blur-md flex flex-col items-center">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
              Time
            </div>
            <div className="text-2xl md:text-3xl font-black font-mono tracking-wider">
              {timerString}
            </div>
          </div>

          {/* Compass Strip To Next Checkpoint */}
          {nextCheckpointDistance > 0 && (
            <div className="bg-slate-900/85 border border-white/10 rounded-full px-4 py-1 flex items-center gap-2 text-white text-[11px] font-bold shadow-md">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider">Target:</span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full relative overflow-hidden flex items-center justify-center">
                <div
                  className="w-2.5 h-2.5 bg-amber-400 rounded-full absolute shadow-sm"
                  style={{ transform: `translateX(${compassOffset * 0.4}px)` }}
                />
              </div>
              <span className="font-mono text-cyan-400 font-bold">{nextCheckpointDistance}m</span>
            </div>
          )}
        </div>

        {/* Right: Character Specialist Badge, Move Book & Pause Trigger */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/85 border border-amber-500/30 rounded-lg px-3.5 py-2 text-white shadow-xl backdrop-blur-md flex items-center gap-2.5">
            <span className="text-amber-400 text-sm">👑</span>
            <div>
              <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">
                {character.role}
              </div>
              <div className="text-xs md:text-sm font-extrabold text-amber-400 tracking-wide">
                {character.name}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenMoveBook}
            className="bg-slate-900/85 hover:bg-slate-800 text-amber-300 p-2.5 rounded-lg border border-white/20 transition cursor-pointer shadow-lg active:scale-95"
            title="Trick & Move Manual"
          >
            <BookOpen size={18} />
          </button>

          <button
            onClick={onPause}
            className="bg-slate-900/85 hover:bg-slate-800 text-white p-2.5 rounded-lg border border-white/20 transition cursor-pointer shadow-lg active:scale-95"
            title="Pause Game (Esc)"
          >
            <Pause size={18} />
          </button>
        </div>
      </div>

      {/* Center Screen: Reticle & Dynamic Grapple Lock Indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Grapple Target Lock Ring */}
        {grappleLocked ? (
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-cyan-400 rounded-full animate-ping opacity-75" />
              <div className="w-8 h-8 border-2 border-cyan-400 rounded-full flex items-center justify-center">
                <Anchor size={14} className="text-cyan-300" />
              </div>
            </div>
            <div className="bg-cyan-950/85 text-cyan-300 border border-cyan-400/50 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mt-1.5 shadow-lg">
              ZIP READY • {grappleDistance}m [E]
            </div>
          </div>
        ) : isFirstPerson ? (
          <div className="w-2.5 h-2.5 rounded-full bg-white/70 shadow-sm border border-black/40" />
        ) : null}

        {/* Pointer Lock Help Banner when not locked on desktop */}
        {!isPointerLocked && (
          <button
            onClick={onPointerLockRequest}
            className="absolute top-[28%] pointer-events-auto bg-slate-900/90 hover:bg-amber-500 hover:text-black text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase border border-amber-500/50 shadow-2xl transition cursor-pointer flex items-center gap-2"
          >
            <Crosshair size={14} /> Click Screen to Look (Mouse Lock)
          </button>
        )}
      </div>

      {/* Floating Trick Combo Toast (Top-Right) */}
      <div
        className={`absolute top-[20%] right-6 transition-all duration-300 transform ${
          toastVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-95'
        }`}
      >
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black font-black px-4 py-2 rounded-lg shadow-2xl text-xs md:text-sm uppercase tracking-wider transform -skew-x-12 border-l-4 border-white flex items-center gap-2">
          <Zap size={16} className="fill-black" />
          {activeToast}
        </div>
      </div>

      {/* Bottom Center Flow Dock (Speedometer & Controls) */}
      <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-end gap-3 pointer-events-none">
        {/* Speed & Flow Multiplier Meter */}
        <div className="pointer-events-auto bg-slate-900/85 border border-white/15 rounded-xl p-3.5 text-white shadow-xl backdrop-blur-md flex items-center gap-4">
          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              Velocity
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-cyan-400">
              {speed.toFixed(1)} <span className="text-xs text-slate-400">m/s</span>
            </div>
          </div>

          <div className="h-9 w-px bg-white/15" />

          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              Flow Ratio
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-amber-400 flex items-center gap-1">
              <Zap size={16} className="text-amber-400 fill-amber-400" />
              {momentum.toFixed(2)}x
            </div>
          </div>

          <div className="h-9 w-px bg-white/15" />

          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              Combo
            </div>
            <div className="text-sm font-black font-mono text-yellow-300">
              {comboCount > 0 ? `x${comboCount}` : '—'}
            </div>
          </div>

          <div className="h-9 w-px bg-white/15" />

          <div>
            <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              State
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              {playerState}
            </div>
          </div>
        </div>

        {/* Quick Actions Cluster (First/Third Person, Grapple, Respawn) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleView}
            className="bg-slate-900/85 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-lg border border-white/20 text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg transition cursor-pointer active:scale-95"
            title="Toggle View (V)"
          >
            {isFirstPerson ? <Eye size={16} /> : <Camera size={16} />}
            <span className="hidden sm:inline">{isFirstPerson ? '1st Person' : '3rd Person'}</span>
            <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded">V</span>
          </button>

          <button
            onClick={onRespawn}
            className="bg-slate-900/85 hover:bg-slate-800 text-amber-400 px-3.5 py-2.5 rounded-lg border border-amber-500/30 text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-lg transition cursor-pointer active:scale-95"
            title="Respawn at checkpoint (R)"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Respawn</span>
            <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">R</span>
          </button>
        </div>
      </div>
    </div>
  );
};
