import React from 'react';
import { X, Download, Send, CheckCircle2, Sparkles } from 'lucide-react';

export interface TranscodeResult {
  id: string;
  url: string;
  fileSize: number;
  duration?: number;
  type: 'round' | 'compress' | 'extract' | 'sticker';
  format?: string;
}

interface Props {
  result: TranscodeResult | null;
  onClose: () => void;
  onSendTelegram: (mediaId: string) => void;
  onExportSticker?: (format: 'webm' | 'gif') => void;
  isSendingTelegram: boolean;
  canSendTelegram: boolean;
  isExportingSticker?: boolean;
}

export const ResultModal: React.FC<Props> = ({
  result,
  onClose,
  onSendTelegram,
  onExportSticker,
  isSendingTelegram,
  canSendTelegram,
  isExportingSticker = false,
}) => {
  if (!result) return null;

  const sizeMb = (result.fileSize / (1024 * 1024)).toFixed(2);
  const isRound = result.type === 'round';
  const isAudio = result.type === 'extract';
  const isSticker = result.type === 'sticker';

  const downloadName = isAudio
    ? `clipround-audio.${result.format || 'mp3'}`
    : isSticker
    ? `clipround-sticker.${result.format || 'webm'}`
    : isRound
    ? 'telegram-video-note.mp4'
    : 'clipround-compressed.mp4';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {isRound
              ? 'Circular Video Note Ready'
              : isSticker
              ? 'Circular Animated Sticker Ready'
              : isAudio
              ? 'Audio Track Extracted'
              : 'Video Compressed'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRound
              ? 'Compliant with Telegram 1:1 H.264 / AAC video note standard'
              : `${sizeMb} MB processed file`}
          </p>
        </div>

        {/* Media Preview Player */}
        <div className="flex items-center justify-center w-full py-2">
          {isRound || isSticker ? (
            <div className="w-56 h-56 rounded-full overflow-hidden shadow-2xl ring-4 ring-sky-500/70 bg-black flex items-center justify-center">
              <video
                src={result.url}
                autoPlay
                loop
                playsInline
                controls={!isSticker}
                className="w-full h-full object-cover"
              />
            </div>
          ) : isAudio ? (
            <div className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-3">
              <audio src={result.url} controls className="w-full" />
            </div>
          ) : (
            <div className="w-full rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800">
              <video
                src={result.url}
                autoPlay
                loop
                playsInline
                controls
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* File Specs Badges */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">
            {sizeMb} MB
          </span>
          {result.duration && (
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">
              {result.duration.toFixed(1)}s
            </span>
          )}
          {(isRound || isSticker) && (
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-sky-400">
              {isSticker ? '512x512' : '480x480 (1:1)'}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2.5 pt-2">
          {canSendTelegram && (
            <button
              type="button"
              disabled={isSendingTelegram}
              onClick={() => onSendTelegram(result.id)}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-blue transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingTelegram ? 'Sending to Telegram...' : 'Send into Telegram Chat'}</span>
            </button>
          )}

          {isRound && onExportSticker && (
            <button
              type="button"
              disabled={isExportingSticker}
              onClick={() => onExportSticker('webm')}
              className="w-full py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-sky-300 font-semibold text-xs flex items-center justify-center gap-2 border border-sky-500/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>{isExportingSticker ? 'Exporting Sticker...' : 'Convert to Animated Sticker (.webm)'}</span>
            </button>
          )}

          <a
            href={result.url}
            download={downloadName}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Download File</span>
          </a>
        </div>
      </div>
    </div>
  );
};
