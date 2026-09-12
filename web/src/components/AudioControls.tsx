import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';

interface Props {
  boostFactor: number;
  onBoostChange: (factor: number) => void;
}

export const AudioControls: React.FC<Props> = ({ boostFactor, onBoostChange }) => {
  const isMuted = boostFactor <= 0.01;

  const toggleMute = () => {
    if (isMuted) {
      onBoostChange(1.0);
    } else {
      onBoostChange(0.0);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted) return <VolumeX className="w-4 h-4 text-red-400" />;
    if (boostFactor > 1.2) return <Volume2 className="w-4 h-4 text-amber-400" />;
    return <Volume1 className="w-4 h-4 text-slate-300" />;
  };

  return (
    <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 rounded hover:bg-slate-800 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {getVolumeIcon()}
          </button>
          <span className="font-semibold text-white">Audio Gain:</span>
          <span className="text-slate-400">
            {isMuted ? 'Muted' : `${Math.round(boostFactor * 100)}%`}
          </span>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onBoostChange(1.0)}
            className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Normal (100%)
          </button>
          <button
            type="button"
            onClick={() => onBoostChange(1.5)}
            className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300"
          >
            Boost (+50%)
          </button>
          <button
            type="button"
            onClick={() => onBoostChange(2.0)}
            className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold"
          >
            2x
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="2.5"
          step="0.05"
          value={boostFactor}
          onChange={(e) => onBoostChange(Number.parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
        />
        <span className="text-xs font-mono text-slate-400 w-12 text-right">
          {boostFactor.toFixed(2)}x
        </span>
      </div>
    </div>
  );
};
