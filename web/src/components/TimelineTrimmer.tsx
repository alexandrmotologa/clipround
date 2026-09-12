import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface Props {
  duration: number;
  currentTime: number;
  trimRange: [number, number];
  isPlaying: boolean;
  onTrimChange: (range: [number, number]) => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onStep: (delta: number) => void;
}

export const TimelineTrimmer: React.FC<Props> = ({
  duration,
  currentTime,
  trimRange,
  isPlaying,
  onTrimChange,
  onTogglePlay,
  onSeek,
  onStep,
}) => {
  const [start, end] = trimRange;
  const clipDuration = Math.max(0.1, end - start);
  const maxAllowedDuration = 60.0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = Number.parseFloat(e.target.value);
    // Ensure start is before end and duration does not exceed 60s
    let newEnd = end;
    if (newStart >= newEnd) {
      newEnd = Math.min(duration, newStart + 1);
    }
    if (newEnd - newStart > maxAllowedDuration) {
      newEnd = newStart + maxAllowedDuration;
    }
    onTrimChange([newStart, newEnd]);
    onSeek(newStart);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = Number.parseFloat(e.target.value);
    let newStart = start;
    if (newEnd <= newStart) {
      newStart = Math.max(0, newEnd - 1);
    }
    if (newEnd - newStart > maxAllowedDuration) {
      newStart = newEnd - maxAllowedDuration;
    }
    onTrimChange([newStart, newEnd]);
  };

  const startPercent = duration > 0 ? (start / duration) * 100 : 0;
  const endPercent = duration > 0 ? (end / duration) * 100 : 100;
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header Info: Clip Length and Telegram 60s indicator */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-white">Clip Length:</span>
          <span className="font-mono text-sky-400 font-medium">
            {clipDuration.toFixed(1)}s
          </span>
          <span className="text-slate-500">/ 60.0s max</span>
        </div>

        <div className="font-mono text-slate-400">
          <span className="text-white">{formatTime(currentTime)}</span>
          <span className="text-slate-600"> / </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Interactive Timeline Track */}
      <div className="relative w-full h-12 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center select-none">
        {/* Selected Clip Highlight Range */}
        <div
          className="absolute top-0 bottom-0 bg-sky-500/20 border-y-2 border-sky-400 z-10 pointer-events-none"
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(0, endPercent - startPercent)}%`,
          }}
        />

        {/* Playhead Indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-glow-accent z-20 pointer-events-none transition-all duration-75"
          style={{ left: `${currentPercent}%` }}
        >
          <div className="w-2 h-2 rounded-full bg-white -ml-[3px] -mt-1 shadow" />
        </div>

        {/* Dual Range Hidden Inputs */}
        <input
          type="range"
          min="0"
          max={duration || 60}
          step="0.1"
          value={start}
          onChange={handleStartChange}
          className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-30 pointer-events-auto"
          title="Drag to adjust start point"
        />
        <input
          type="range"
          min="0"
          max={duration || 60}
          step="0.1"
          value={end}
          onChange={handleEndChange}
          className="absolute inset-0 w-full opacity-0 cursor-ew-resize z-30 pointer-events-auto"
          title="Drag to adjust end point"
        />

        {/* Start / End Boundary Handles UI */}
        <div
          className="absolute top-0 bottom-0 w-3 bg-sky-500 rounded-l-md z-20 flex items-center justify-center cursor-ew-resize pointer-events-none"
          style={{ left: `calc(${startPercent}% - 3px)` }}
        >
          <div className="w-0.5 h-4 bg-white/80 rounded" />
        </div>
        <div
          className="absolute top-0 bottom-0 w-3 bg-sky-500 rounded-r-md z-20 flex items-center justify-center cursor-ew-resize pointer-events-none"
          style={{ left: `calc(${endPercent}% - 9px)` }}
        >
          <div className="w-0.5 h-4 bg-white/80 rounded" />
        </div>
      </div>

      {/* Scrubber & Jog Controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStep(-0.1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Step back 0.1s"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center gap-1.5 shadow-glow-blue transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Loop</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onStep(0.1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Step forward 0.1s"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onTrimChange([0, Math.min(duration, 60)]);
            onSeek(0);
          }}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-800"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset 60s</span>
        </button>
      </div>
    </div>
  );
};
