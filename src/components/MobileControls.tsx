import React, { useRef, useState, useEffect } from 'react';
import { Anchor } from 'lucide-react';

interface MobileControlsProps {
  onJoystickMove: (x: number, y: number) => void;
  onActionTrigger: (
    action: 'jump' | 'slide' | 'roll' | 'grapple' | 'wallrun',
    active: boolean
  ) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onActionTrigger,
}) => {
  const joyZoneRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch capability or small viewport
    const checkTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 1024;
    setIsTouchDevice(checkTouch);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchOriginRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchOriginRef.current || !knobRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchOriginRef.current.x;
    const dy = touch.clientY - touchOriginRef.current.y;
    const dist = Math.min(Math.hypot(dx, dy), 48);
    const angle = Math.atan2(dy, dx);

    const kx = Math.cos(angle) * dist;
    const ky = Math.sin(angle) * dist;

    knobRef.current.style.transform = `translate(${kx}px, ${ky}px)`;

    // Normalized vector: X is right (-1 to 1), Y is forward (-1 to 1)
    onJoystickMove(kx / 48, -ky / 48);
  };

  const handleTouchEnd = () => {
    touchOriginRef.current = null;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }
    onJoystickMove(0, 0);
  };

  if (!isTouchDevice) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex justify-between items-end p-6 select-none">
      {/* Virtual Analog Joystick */}
      <div
        ref={joyZoneRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-white/10 border-2 border-dashed border-white/25 relative flex items-center justify-center pointer-events-auto touch-none shadow-2xl backdrop-blur-sm"
      >
        <div
          ref={knobRef}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(255,153,0,0.6)] pointer-events-none transition-transform duration-75"
        />
      </div>

      {/* Action Buttons Grid Cluster */}
      <div className="grid grid-cols-2 gap-3.5 pointer-events-auto transform -rotate-3">
        <button
          onTouchStart={() => onActionTrigger('roll', true)}
          onTouchEnd={() => onActionTrigger('roll', false)}
          className="w-16 h-16 rounded-full border-2 border-white/40 bg-slate-900/80 text-white font-extrabold text-[11px] uppercase flex flex-col items-center justify-center shadow-2xl active:bg-amber-500 active:text-black active:scale-95 transition-transform"
        >
          Roll
        </button>

        <button
          onTouchStart={() => onActionTrigger('slide', true)}
          onTouchEnd={() => onActionTrigger('slide', false)}
          className="w-16 h-16 rounded-full border-2 border-white/40 bg-slate-900/80 text-white font-extrabold text-[11px] uppercase flex flex-col items-center justify-center shadow-2xl active:bg-amber-500 active:text-black active:scale-95 transition-transform"
        >
          Slide
        </button>

        <button
          onTouchStart={() => onActionTrigger('grapple', true)}
          onTouchEnd={() => onActionTrigger('grapple', false)}
          className="w-16 h-16 rounded-full border-2 border-cyan-400/60 bg-cyan-950/60 text-cyan-300 font-extrabold text-[11px] uppercase flex flex-col items-center justify-center shadow-2xl active:bg-cyan-400 active:text-black active:scale-95 transition-transform"
        >
          <Anchor size={14} className="mb-0.5" />
          Zip
        </button>

        <button
          onTouchStart={() => onActionTrigger('jump', true)}
          onTouchEnd={() => onActionTrigger('jump', false)}
          className="w-16 h-16 rounded-full border-2 border-amber-500 bg-amber-500/30 text-amber-300 font-black text-xs uppercase flex flex-col items-center justify-center shadow-2xl active:bg-amber-500 active:text-black active:scale-95 transition-transform"
        >
          Jump
        </button>
      </div>
    </div>
  );
};
