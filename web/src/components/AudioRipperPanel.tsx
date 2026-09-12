import React, { useState } from 'react';
import { Music, Check } from 'lucide-react';

interface Props {
  onExtract: (format: 'mp3' | 'aac', bitrate: string) => void;
  isProcessing: boolean;
}

export const AudioRipperPanel: React.FC<Props> = ({ onExtract, isProcessing }) => {
  const [format, setFormat] = useState<'mp3' | 'aac'>('mp3');
  const [bitrate, setBitrate] = useState<string>('192k');

  return (
    <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
      <div>
        <h3 className="font-semibold text-white text-sm">Audio Extractor</h3>
        <p className="text-xs text-slate-400">Rip background music or voice track directly from video</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-slate-300">Format</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFormat('mp3')}
            className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
              format === 'mp3'
                ? 'bg-sky-500/10 border-sky-500/80 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300'
            }`}
          >
            <div>
              <div className="font-semibold text-sm">MP3</div>
              <div className="text-[11px] text-slate-400">Universal compatibility</div>
            </div>
            {format === 'mp3' && <Check className="w-4 h-4 text-sky-400" />}
          </button>

          <button
            type="button"
            onClick={() => setFormat('aac')}
            className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
              format === 'aac'
                ? 'bg-sky-500/10 border-sky-500/80 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-300'
            }`}
          >
            <div>
              <div className="font-semibold text-sm">AAC</div>
              <div className="text-[11px] text-slate-400">Telegram native audio</div>
            </div>
            {format === 'aac' && <Check className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-slate-300">Bitrate Quality</label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {['128k', '192k', '320k'].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setBitrate(rate)}
              className={`py-2 rounded-lg border font-mono font-medium transition-colors ${
                bitrate === rate
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {rate.replace('k', ' kbps')}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={isProcessing}
        onClick={() => onExtract(format, bitrate)}
        className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-blue transition-all mt-2"
      >
        <Music className="w-4 h-4" />
        <span>{isProcessing ? 'Extracting Audio...' : `Export Audio (${format.toUpperCase()})`}</span>
      </button>
    </div>
  );
};
