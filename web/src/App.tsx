import { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, AlertCircle, Music, Camera, Link2 } from 'lucide-react';
import { CircularViewfinder, type CropParameters } from './components/CircularViewfinder';
import { TimelineTrimmer } from './components/TimelineTrimmer';
import { AudioControls } from './components/AudioControls';
import { EffectsBar, type EffectsState } from './components/EffectsBar';
import { CompressionPanel } from './components/CompressionPanel';
import { AudioRipperPanel } from './components/AudioRipperPanel';
import { ResultModal, type TranscodeResult } from './components/ResultModal';
import { CameraRecorderModal } from './components/CameraRecorderModal';
import { UrlImportModal } from './components/UrlImportModal';
import { useTelegram } from './hooks/useTelegram';
import { useVideoPlayer } from './hooks/useVideoPlayer';

export function App() {
  const { isTelegram, user, triggerHaptic, getInitData } = useTelegram();
  const {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    videoDimensions,
    trimRange,
    setTrimRange,
    togglePlay,
    seek,
    stepFrame,
  } = useVideoPlayer();

  // Active Tool Mode
  const [activeTab, setActiveTab] = useState<'round' | 'compress' | 'extract'>('round');

  // Active media state
  const [mediaId, setMediaId] = useState<string>('demo');
  const [videoSrc, setVideoSrc] = useState<string>('/sample.mp4');
  const [fileName, setFileName] = useState<string>('sample.mp4');
  const [fileSizeMb, setFileSizeMb] = useState<number>(0.3);

  // Edit states
  const [cropParams, setCropParams] = useState<CropParameters>({
    cropX: 0,
    cropY: 0,
    cropSize: 720,
  });
  const [audioBoost, setAudioBoost] = useState<number>(1.0);

  // Advanced effects
  const [effects, setEffects] = useState<EffectsState>({
    speedMultiplier: 1.0,
    flipHorizontal: false,
    loudnorm: false,
    colorPreset: 'none',
    textOverlay: '',
  });

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUrlImportOpen, setIsUrlImportOpen] = useState(false);

  // Processing & modal state
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportingSticker, setIsExportingSticker] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [result, setResult] = useState<TranscodeResult | null>(null);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check URL parameters for mediaId (passed by Telegram bot)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get('mediaId') || params.get('id');
    if (idFromQuery) {
      setMediaId(idFromQuery);
      setVideoSrc(`/api/media/${idFromQuery}`);
      setFileName(`telegram-${idFromQuery.slice(0, 8)}.mp4`);
      fetch(`/api/probe/${idFromQuery}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.sizeBytes) {
            setFileSizeMb(data.sizeBytes / (1024 * 1024));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Handle local video upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid MP4 or MOV video file.');
      return;
    }

    setErrorMessage(null);
    setProgressStatus('Uploading video...');
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const data = await res.json();
      setMediaId(data.id);
      setVideoSrc(data.url);
      setFileName(data.fileName);
      setFileSizeMb(data.fileSize / (1024 * 1024));
      triggerHaptic('success');
    } catch (err) {
      console.warn('Server upload not reachable, loading via local object URL:', err);
      const localUrl = URL.createObjectURL(file);
      setVideoSrc(localUrl);
      setFileName(file.name);
      setFileSizeMb(file.size / (1024 * 1024));
      setMediaId('local_blob');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  // Process circular video note
  const handleProcessRound = async () => {
    setIsProcessing(true);
    setProgressStatus('Transcoding circular 1:1 video note...');
    triggerHaptic('medium');
    setErrorMessage(null);

    try {
      const payload = {
        mediaId,
        startTime: trimRange[0],
        duration: trimRange[1] - trimRange[0],
        cropX: cropParams.cropX,
        cropY: cropParams.cropY,
        cropSize: cropParams.cropSize,
        audioBoost,
        targetDimension: 480,
        speedMultiplier: effects.speedMultiplier,
        flipHorizontal: effects.flipHorizontal,
        loudnorm: effects.loudnorm,
        colorPreset: effects.colorPreset,
        textOverlay: effects.textOverlay,
      };

      const res = await fetch('/api/process/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Transcoding failed with status ${res.status}`);
      }

      const data = await res.json();
      setResult({
        id: data.id,
        url: data.url,
        fileSize: data.fileSize,
        duration: data.duration,
        type: 'round',
      });
      triggerHaptic('success');
    } catch (err) {
      setErrorMessage((err as Error).message);
      triggerHaptic('error');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  // Process circular animated sticker
  const handleExportSticker = async (format: 'webm' | 'gif' = 'webm') => {
    setIsExportingSticker(true);
    triggerHaptic('medium');

    try {
      const payload = {
        mediaId,
        startTime: trimRange[0],
        duration: Math.min(3, trimRange[1] - trimRange[0]),
        cropX: cropParams.cropX,
        cropY: cropParams.cropY,
        cropSize: cropParams.cropSize,
        format,
      };

      const res = await fetch('/api/process/sticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Sticker creation failed');
      }

      const data = await res.json();
      setResult({
        id: data.id,
        url: data.url,
        fileSize: data.fileSize,
        type: 'sticker',
        format,
      });
      triggerHaptic('success');
    } catch (err) {
      alert(`Sticker export failed: ${(err as Error).message}`);
      triggerHaptic('error');
    } finally {
      setIsExportingSticker(false);
    }
  };

  // Process compression
  const handleCompress = async (preset: 'telegram10' | 'telegram25' | 'telegram50' | 'custom', crf?: number) => {
    setIsProcessing(true);
    setProgressStatus('Compressing video file...');
    triggerHaptic('medium');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/process/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, preset, crf }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Compression failed: ${res.status}`);
      }

      const data = await res.json();
      setResult({
        id: data.id,
        url: data.url,
        fileSize: data.fileSize,
        duration: data.duration,
        type: 'compress',
      });
      triggerHaptic('success');
    } catch (err) {
      setErrorMessage((err as Error).message);
      triggerHaptic('error');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  // Process audio extraction
  const handleExtractAudio = async (format: 'mp3' | 'aac', bitrate: string) => {
    setIsProcessing(true);
    setProgressStatus('Extracting audio stream...');
    triggerHaptic('medium');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/process/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, format, bitrate }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Audio extraction failed: ${res.status}`);
      }

      const data = await res.json();
      setResult({
        id: data.id,
        url: data.url,
        fileSize: data.fileSize,
        type: 'extract',
        format,
      });
      triggerHaptic('success');
    } catch (err) {
      setErrorMessage((err as Error).message);
      triggerHaptic('error');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  // Send result back to Telegram
  const handleSendTelegram = async (targetId: string) => {
    setIsSendingTelegram(true);
    triggerHaptic('medium');

    try {
      const res = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: targetId,
          initData: getInitData(),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to send to Telegram');
      }

      triggerHaptic('success');
      alert('Sent successfully to Telegram chat!');
    } catch (err) {
      alert(`Send to Telegram failed: ${(err as Error).message}`);
      triggerHaptic('error');
    } finally {
      setIsSendingTelegram(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-6 selection:bg-sky-500">
      {/* Top Header */}
      <header className="w-full max-w-xl flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-glow-blue">
            <div className="w-4 h-4 rounded-full border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">ClipRound</h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-semibold">
                Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">Circular Telegram Video Note Creator</p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Record with Camera"
          >
            <Camera className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Record</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUrlImportOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Paste Video URL"
          >
            <Link2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Link</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileUpload(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-glow-blue"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Upload</span>
          </button>
        </div>
      </header>

      {/* User Greeting (if Telegram) or Demo Mode Badge */}
      <div className="w-full max-w-xl mb-4 flex items-center justify-between text-xs px-1">
        {user ? (
          <span className="text-slate-300">
            Connected as <strong className="text-sky-400">{user.name}</strong>
          </span>
        ) : (
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Studio Mode</span>
          </span>
        )}
        <span className="font-mono text-slate-500 text-[11px] truncate max-w-[200px]">
          {fileName} ({fileSizeMb.toFixed(1)} MB)
        </span>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="w-full max-w-xl mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="w-full max-w-xl grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-6 shadow-lg">
        <button
          type="button"
          onClick={() => { setActiveTab('round'); triggerHaptic('light'); }}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'round'
              ? 'bg-sky-500 text-white shadow-glow-blue'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full border border-current" />
          <span>Circular Note</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('compress'); triggerHaptic('light'); }}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'compress'
              ? 'bg-sky-500 text-white shadow-glow-blue'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Compress</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('extract'); triggerHaptic('light'); }}
          className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'extract'
              ? 'bg-sky-500 text-white shadow-glow-blue'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Extract Audio</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-xl flex flex-col items-center gap-6">
        {activeTab === 'round' && (
          <>
            {/* Viewfinder with Circular Mask & Drag Pan */}
            <CircularViewfinder
              videoRef={videoRef}
              videoSrc={videoSrc}
              videoDimensions={videoDimensions}
              onCropChange={setCropParams}
            />

            {/* Timeline Trimmer with Visual Audio Waveform */}
            <TimelineTrimmer
              duration={duration}
              currentTime={currentTime}
              trimRange={trimRange}
              isPlaying={isPlaying}
              videoSrc={videoSrc}
              onTrimChange={setTrimRange}
              onTogglePlay={togglePlay}
              onSeek={seek}
              onStep={stepFrame}
            />

            {/* Advanced Effects & Speed Controls */}
            <EffectsBar
              effects={effects}
              onChange={setEffects}
            />

            {/* Audio Boost Controls */}
            <AudioControls
              boostFactor={audioBoost}
              onBoostChange={setAudioBoost}
            />

            {/* Render Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleProcessRound}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 active:from-sky-600 active:to-cyan-500 disabled:opacity-50 text-white font-bold text-sm shadow-glow-blue transition-all flex items-center justify-center gap-2"
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white" />
              <span>
                {isProcessing
                  ? progressStatus || 'Rendering Video Note...'
                  : 'Render Circular Video Note (480x480)'}
              </span>
            </button>
          </>
        )}

        {activeTab === 'compress' && (
          <>
            <div className="w-full rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-xl">
              <video
                src={videoSrc}
                playsInline
                controls
                className="w-full h-full object-contain"
              />
            </div>

            <CompressionPanel
              fileSizeMb={fileSizeMb}
              durationSec={duration}
              onCompress={handleCompress}
              isProcessing={isProcessing}
            />
          </>
        )}

        {activeTab === 'extract' && (
          <>
            <div className="w-full rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800 shadow-xl">
              <video
                src={videoSrc}
                playsInline
                controls
                className="w-full h-full object-contain"
              />
            </div>

            <AudioRipperPanel
              onExtract={handleExtractAudio}
              isProcessing={isProcessing}
            />
          </>
        )}
      </main>

      {/* Result Modal */}
      <ResultModal
        result={result}
        onClose={() => setResult(null)}
        onSendTelegram={handleSendTelegram}
        onExportSticker={handleExportSticker}
        isSendingTelegram={isSendingTelegram}
        canSendTelegram={isTelegram || !!user}
        isExportingSticker={isExportingSticker}
      />

      {/* Camera Recorder Modal */}
      <CameraRecorderModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onRecordingComplete={handleFileUpload}
      />

      {/* URL Import Modal */}
      <UrlImportModal
        isOpen={isUrlImportOpen}
        onClose={() => setIsUrlImportOpen(false)}
        onImportSuccess={(data) => {
          setMediaId(data.id);
          setVideoSrc(data.url);
          setFileName(data.fileName);
          setFileSizeMb(data.fileSize / (1024 * 1024));
        }}
      />
    </div>
  );
}
