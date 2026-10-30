import React from 'react';
import { X, Volume2, Eye, Compass, Sliders } from 'lucide-react';
import { GameConfig } from '../game/config/GameConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mouseSensitivity: number;
  onSensitivityChange: (val: number) => void;
  fov: number;
  onFovChange: (val: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (val: number) => void;
  sfxVolume: number;
  onSfxVolumeChange: (val: number) => void;
  isFirstPerson: boolean;
  onToggleFirstPerson: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  mouseSensitivity,
  onSensitivityChange,
  fov,
  onFovChange,
  masterVolume,
  onMasterVolumeChange,
  sfxVolume,
  onSfxVolumeChange,
  isFirstPerson,
  onToggleFirstPerson,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-center items-center p-4 select-none">
      <div className="max-w-md w-full bg-slate-900 border border-white/20 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-amber-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              Settings & Feel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs font-semibold text-slate-300">
          {/* Mouse Sensitivity */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="flex items-center gap-1.5">
                <Compass size={14} className="text-cyan-400" /> Mouse Sensitivity
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {(mouseSensitivity * 1000).toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.0008"
              max="0.005"
              step="0.0002"
              value={mouseSensitivity}
              onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Field of View */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="flex items-center gap-1.5">
                <Eye size={14} className="text-cyan-400" /> Base Field of View (FOV)
              </span>
              <span className="font-mono text-cyan-400 font-bold">{Math.round(fov)}°</span>
            </div>
            <input
              type="range"
              min="60"
              max="95"
              step="1"
              value={fov}
              onChange={(e) => onFovChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Master Volume */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 size={14} className="text-amber-400" /> Master Volume
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="flex items-center gap-1.5">
                <Volume2 size={14} className="text-amber-400" /> SFX Volume
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Default Perspective Toggle */}
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span>Camera Perspective:</span>
            <button
              onClick={onToggleFirstPerson}
              className="px-3 py-1.5 rounded-lg border border-white/20 bg-slate-800 text-white text-xs font-bold uppercase transition hover:border-amber-500 cursor-pointer"
            >
              {isFirstPerson ? 'First-Person' : 'Third-Person'}
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer mt-2"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
};
