import React from 'react';
import { FastForward, FlipHorizontal, Sparkles, Mic, Type } from 'lucide-react';

export interface EffectsState {
  speedMultiplier: number;
  flipHorizontal: boolean;
  loudnorm: boolean;
  colorPreset: 'none' | 'vivid' | 'bw' | 'warm' | 'cool';
  textOverlay: string;
}

interface Props {
  effects: EffectsState;
  onChange: (effects: EffectsState) => void;
}

export const EffectsBar: React.FC<Props> = ({ effects, onChange }) => {
  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const colors = [
    { id: 'none', label: 'Normal' },
    { id: 'vivid', label: 'Vivid' },
    { id: 'bw', label: 'B&W' },
    { id: 'warm', label: 'Warm' },
    { id: 'cool', label: 'Cool' },
  ] as const;

  return (
    <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Speed & Mirror Row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <FastForward className="w-3.5 h-3.5 text-sky-400" />
            <span>Playback Speed:</span>
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...effects, flipHorizontal: !effects.flipHorizontal })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
              effects.flipHorizontal
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Mirror (Selfie)</span>
          </button>
        </div>

        <div className="grid grid-cols-6 gap-1 text-xs">
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...effects, speedMultiplier: s })}
              className={`py-1.5 rounded-lg font-mono font-medium transition-all ${
                effects.speedMultiplier === s
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter Presets */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Color Grading:</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-xs">
          {colors.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange({ ...effects, colorPreset: c.id })}
              className={`py-1.5 rounded-lg font-medium transition-all ${
                effects.colorPreset === c.id
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audio Loudnorm & Text Caption */}
      <div className="flex flex-col gap-3 pt-1 border-t border-slate-800/80">
        {/* Loudnorm toggle */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium">Speech Normalizer (EBU R128):</span>
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...effects, loudnorm: !effects.loudnorm })}
            className={`w-10 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
              effects.loudnorm ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                effects.loudnorm ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Text Caption Overlay */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">Burn-in Text Caption (Optional):</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {effects.textOverlay.length}/40
            </span>
          </div>

          <input
            type="text"
            maxLength={40}
            placeholder="e.g. Watch until the end! ⚡"
            value={effects.textOverlay}
            onChange={(e) => onChange({ ...effects, textOverlay: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
    </div>
  );
};
