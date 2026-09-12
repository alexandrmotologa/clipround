import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Square, RotateCw, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (file: File) => void;
}

export const CameraRecorderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRecordingComplete,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      setStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    setErrorMsg(null);
    stopStream();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: true,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setErrorMsg(`Camera access failed: ${(err as Error).message}`);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      setIsRecording(false);
      setRecordSeconds(0);
      setCountdown(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  const handleStartCountdown = () => {
    setCountdown(3);
    const countTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countTimer);
          startActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startActualRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];

    // Check supported MIME type
    let mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    try {
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const file = new File([blob], `recorded-${Date.now()}.mp4`, { type: 'video/mp4' });
        onRecordingComplete(file);
        onClose();
      };

      recorder.start(250); // 250ms chunks
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s >= 59) {
            stopRecording();
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      setErrorMsg(`Recorder error: ${(err as Error).message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
            <Camera className="w-4 h-4 text-sky-400" />
            <span>Record Video Note</span>
          </h2>
          <p className="text-xs text-slate-400">Position face inside circular frame (max 60s)</p>
        </div>

        {errorMsg ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden bg-black ring-4 ring-sky-500/60 shadow-glow-blue flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />

            {countdown !== null && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-6xl font-black text-white animate-ping">{countdown}</span>
              </div>
            )}

            {isRecording && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>{recordSeconds}s / 60s</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2">
          {!isRecording && (
            <button
              type="button"
              onClick={toggleFacingMode}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="Switch Camera"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Recording</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={countdown !== null || !!errorMsg}
              onClick={handleStartCountdown}
              className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm flex items-center gap-2 shadow-glow-blue transition-transform active:scale-95 disabled:opacity-50"
            >
              <span className="w-3 h-3 rounded-full bg-white" />
              <span>Start Recording</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
