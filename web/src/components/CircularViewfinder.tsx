import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Move, Maximize2, User } from 'lucide-react';

export interface CropParameters {
  cropX: number;
  cropY: number;
  cropSize: number;
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  videoDimensions: { width: number; height: number };
  onCropChange: (crop: CropParameters) => void;
}

export const CircularViewfinder: React.FC<Props> = ({
  videoRef,
  videoSrc,
  videoDimensions,
  onCropChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  // Calculate crop coordinates based on videoDimensions, zoom, and pan
  const computeCrop = useCallback(() => {
    const { width, height } = videoDimensions;
    if (!width || !height) return;

    const minDim = Math.min(width, height);
    // cropSize in original video pixels (at zoom 1.0, it's minDim; at zoom 2.0, it's minDim / 2)
    const effectiveCropSize = Math.max(32, minDim / zoom);

    // Center baseline
    const centerX = width / 2;
    const centerY = height / 2;

    // Pan offsets mapped to source video pixels
    // Normalized pan range -1.0 to 1.0
    const maxShiftX = (width - effectiveCropSize) / 2;
    const maxShiftY = (height - effectiveCropSize) / 2;

    const sourceShiftX = -pan.x * maxShiftX;
    const sourceShiftY = -pan.y * maxShiftY;

    let cropX = centerX - effectiveCropSize / 2 + sourceShiftX;
    let cropY = centerY - effectiveCropSize / 2 + sourceShiftY;

    // Clamp inside video bounds
    cropX = Math.max(0, Math.min(cropX, width - effectiveCropSize));
    cropY = Math.max(0, Math.min(cropY, height - effectiveCropSize));

    onCropChange({
      cropX: Math.round(cropX),
      cropY: Math.round(cropY),
      cropSize: Math.round(effectiveCropSize),
    });
  }, [videoDimensions, zoom, pan, onCropChange]);

  useEffect(() => {
    computeCrop();
  }, [computeCrop]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    // Sensitivity factor
    const sensitivity = 0.005;
    setPan({
      x: Math.max(-1, Math.min(1, dragStartRef.current.initialPanX + deltaX * sensitivity)),
      y: Math.max(-1, Math.min(1, dragStartRef.current.initialPanY + deltaY * sensitivity)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const setPreset = (type: 'center' | 'top' | 'bottom') => {
    if (type === 'center') {
      setPan({ x: 0, y: 0 });
    } else if (type === 'top') {
      setPan({ x: 0, y: 0.5 }); // Pushes video down to frame top/face
    } else if (type === 'bottom') {
      setPan({ x: 0, y: -0.5 });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Circular Viewfinder Screen */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full overflow-hidden shadow-2xl ring-4 ring-sky-500/50 cursor-grab active:cursor-grabbing select-none bg-black flex items-center justify-center"
        style={{
          boxShadow: '0 0 50px -10px rgba(14, 165, 233, 0.4)',
        }}
      >
        {/* HTML5 Video Layer */}
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          muted
          loop
          className="absolute max-w-none pointer-events-none object-cover transition-transform duration-75"
          style={{
            transform: `scale(${zoom}) translate(${pan.x * 20}%, ${pan.y * 20}%)`,
            width: videoDimensions.width && videoDimensions.height && videoDimensions.width > videoDimensions.height ? 'auto' : '100%',
            height: videoDimensions.width && videoDimensions.height && videoDimensions.width > videoDimensions.height ? '100%' : 'auto',
          }}
        />

        {/* Telegram Circular Bubble Overlay Frame */}
        <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-full" />

        {/* Target Guide Crosshairs */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
          <div className="w-8 h-[1px] bg-white absolute" />
          <div className="h-8 w-[1px] bg-white absolute" />
          <div className="w-16 h-16 rounded-full border border-dashed border-white/40 absolute" />
        </div>

        {/* Drag Hint Badge */}
        <div className="absolute bottom-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-slate-300 font-medium flex items-center gap-1.5 pointer-events-none border border-white/10">
          <Move className="w-3 h-3 text-sky-400" />
          <span>Drag to pan subject</span>
        </div>
      </div>

      {/* Viewfinder Controls & Presets */}
      <div className="w-full max-w-sm flex flex-col gap-3 px-2">
        {/* Zoom Slider */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-sm">
          <ZoomOut className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            min="1.0"
            max="2.5"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <ZoomIn className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-mono text-sky-400 w-10 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        {/* Framing Presets */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium pl-1">Framing:</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setPreset('top')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors border border-slate-700/60"
            >
              <User className="w-3 h-3 text-sky-400" />
              <span>Face / Top</span>
            </button>
            <button
              type="button"
              onClick={() => setPreset('center')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors border border-slate-700/60"
            >
              <Maximize2 className="w-3 h-3 text-emerald-400" />
              <span>Center</span>
            </button>
            <button
              type="button"
              onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1.0); }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
