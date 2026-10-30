import React from 'react';
import { X, BookOpen, Zap, Compass, ArrowUp, Move, Wind, Anchor } from 'lucide-react';

interface MoveBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MoveBookModal: React.FC<MoveBookModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const moves = [
    {
      title: 'Power Slide & Slide-Jump',
      icon: <Wind size={20} className="text-amber-400" />,
      inputs: ['SHIFT + W (Sprint)', 'Press C (Slide)', 'Press SPACE (Slide Hop)'],
      description:
        'Sprinting and dropping into a slide gives an instant burst of kinetic velocity while ducking under low pipes. Tapping Jump during a slide converts slide speed into a massive forward launch!',
      flowBonus: '+150 to +200 Flow',
    },
    {
      title: 'Wall-Run & Wall-Kick',
      icon: <Move size={20} className="text-cyan-400" />,
      inputs: ['Jump toward wall while airborne', 'Hold SHIFT / W along wall', 'Press SPACE (Kick off)'],
      description:
        'Run along any vertical billboard or skyscraper face. Gravity drops by 72% while your camera tilts into the run. Jumping kicks off the wall with high outward and upward momentum!',
      flowBonus: '+250 Flow (Refreshes Double Jump)',
    },
    {
      title: 'Speed Vault & Ledge Mantle',
      icon: <ArrowUp size={20} className="text-emerald-400" />,
      inputs: ['Sprint toward waist-height obstacle (Auto-Vault)', 'Reach rooftop ledge (Auto-Mantle)'],
      description:
        'Dual-tier raycasts detect obstacle heights in real-time. Low AC units & vents (0.6–1.3m) are vaulted with an instant speed boost. High ledges (1.4–2.8m) trigger smooth kinematic climbing.',
      flowBonus: '+180 Flow',
    },
    {
      title: 'Cyber Grapple Hook Zipline',
      icon: <Anchor size={20} className="text-blue-400" />,
      inputs: ['Look at cyan anchor ring on cranes/towers', 'Press E or Left Click', 'Press SPACE (Apex Launch)'],
      description:
        'Fires an energy cable to illuminated rooftop anchor points. Accelerates you through the air with pendulum pull physics. Pressing Jump at the apex of the swing rockets you sky-high!',
      flowBonus: '+220 Flow',
    },
    {
      title: 'Safety Dive Roll on Landing',
      icon: <Zap size={20} className="text-yellow-400" />,
      inputs: ['High fall descent', 'Press C right before touchdown'],
      description:
        'High skyscraper drops normally cause hard impact stumbles and speed loss. Timing a roll right before touchdown absorbs the shock, rolls 360°, and instantly converts the fall into a sprint burst!',
      flowBonus: '+250 Flow (Preserves Full Momentum)',
    },
    {
      title: 'Momentum Multiplier (Flow Ratio)',
      icon: <Zap size={20} className="text-purple-400" />,
      inputs: ['Chain parkour moves continuously without standing still'],
      description:
        'Chaining moves without stopping raises your Flow Ratio up to 1.85x base speed! Moving fast expands camera FOV and activates peripheral speed lines.',
      flowBonus: 'Up to 1.85x Max Velocity',
    },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-center items-center p-4 select-none">
      <div className="max-w-2xl w-full bg-slate-900 border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-amber-400" />
            <div>
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                Parkour Trick Book & Field Manual
              </h2>
              <p className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">
                Master core movement, momentum combos, and traversal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {moves.map((m, idx) => (
            <div
              key={idx}
              className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {m.icon}
                  <h3 className="text-sm font-black text-white uppercase">{m.title}</h3>
                </div>

                <div className="flex flex-wrap gap-1 my-2">
                  {m.inputs.map((inp, iIdx) => (
                    <span
                      key={iIdx}
                      className="text-[10px] bg-black/50 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-white/10"
                    >
                      {inp}
                    </span>
                  ))}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                  {m.description}
                </p>
              </div>

              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider border-t border-white/5 pt-1.5 flex justify-between">
                <span>Reward:</span>
                <span>{m.flowBonus}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer mt-1"
        >
          Got It • Back To The Rooftops
        </button>
      </div>
    </div>
  );
};
