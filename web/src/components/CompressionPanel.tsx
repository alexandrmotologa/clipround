import React, { useState } from 'react';
import { Zap, Check, Sliders } from 'lucide-react';

interface Props {
  fileSizeMb: number;
  durationSec?: number;
  onCompress: (preset: 'telegram10' | 'telegram25' | 'telegram50' | 'custom', crf?: number) => void;
  isProcessing: boolean;
}

export const CompressionPanel: React.FC<Props> = ({
  fileSizeMb,
  onCompress,
  isProcessing,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<'telegram10' | 'telegram25' | 'telegram50' | 'custom'>('telegram10');
  const [customCrf, setCustomCrf] = useState(28);

  const presets = [
    {
      id: 'telegram10' as const,
      name: 'Quick Share',
      target: '10 MB',
      desc: 'Instant Telegram mobile preview & fast send',
      badge: 'Recommended',
    },
    {
      id: 'telegram25' as const,
      name: 'High Quality',
      target: '25 MB',
      desc: 'Balanced clarity for 1080p and longer videos',
    },
    {
      id: 'telegram50' as const,
      name: 'Maximum Detail',
      target: '50 MB',
      desc: 'Near lossless for presentations or long recordings',
    },
  ];

  return (
    <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Smart Video Compressor</h3>
          <p className="text-xs text-slate-400">Reduce video file size without visible artifacting</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Current Size</div>
          <div className="font-mono text-sm font-semibold text-white">{fileSizeMb.toFixed(1)} MB</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {presets.map((preset) => {
          const isSelected = selectedPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPreset(preset.id)}
              className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-sky-500/10 border-sky-500/80 shadow-glow-blue'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{preset.name}</span>
                  {preset.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-medium">
                      {preset.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{preset.desc}</span>
              </div>

              <div className="flex items-center gap-2 pl-3">
                <span className="text-xs font-mono font-semibold text-sky-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {preset.target}
                </span>
                {isSelected && <Check className="w-4 h-4 text-sky-400" />}
              </div>
            </button>
          );
        })}

        {/* Custom CRF Mode */}
        <button
          type="button"
          onClick={() => setSelectedPreset('custom')}
          className={`p-3 rounded-xl text-left border transition-all flex flex-col gap-2 ${
            selectedPreset === 'custom'
              ? 'bg-sky-500/10 border-sky-500/80'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-white">Custom CRF Tuning</span>
            </div>
            <span className="text-xs font-mono text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              CRF {customCrf}
            </span>
          </div>

          {selectedPreset === 'custom' && (
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-slate-400">18 (HQ)</span>
              <input
                type="range"
                min="18"
                max="36"
                step="1"
                value={customCrf}
                onChange={(e) => setCustomCrf(Number.parseInt(e.target.value, 10))}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="text-xs text-slate-400">36 (Small)</span>
            </div>
          )}
        </button>
      </div>

      <button
        type="button"
        disabled={isProcessing}
        onClick={() => onCompress(selectedPreset, selectedPreset === 'custom' ? customCrf : undefined)}
        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-blue transition-all"
      >
        <Zap className="w-4 h-4" />
        <span>{isProcessing ? 'Compressing Video...' : 'Start Video Compression'}</span>
      </button>
    </div>
  );
};
