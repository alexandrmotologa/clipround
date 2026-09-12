import React, { useState } from 'react';
import { X, Link2, Download, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (mediaData: { id: string; url: string; fileName: string; fileSize: number }) => void;
}

export const UrlImportModal: React.FC<Props> = ({ isOpen, onClose, onImportSuccess }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/download-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Download failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      onImportSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-left">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-sky-400" />
            <span>Import Video from URL</span>
          </h2>
          <p className="text-xs text-slate-400">Paste a direct link to any MP4, MOV, or WebM video file</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleDownload} className="flex flex-col gap-3">
          <input
            type="url"
            required
            placeholder="https://example.com/video.mp4"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 font-mono"
          />

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-glow-blue transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isLoading ? 'Downloading Media...' : 'Fetch & Open in Studio'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
