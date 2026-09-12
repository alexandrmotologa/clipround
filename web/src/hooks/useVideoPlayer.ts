import { useState, useRef, useEffect, useCallback } from 'react';

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 60]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // If current time is beyond trim end, seek to trim start first
      if (videoRef.current.currentTime >= trimRange[1]) {
        videoRef.current.currentTime = trimRange[0];
      }
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, trimRange]);

  const seek = useCallback((time: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(time, duration));
    videoRef.current.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const stepFrame = useCallback((deltaSec: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(trimRange[0], Math.min(videoRef.current.currentTime + deltaSec, trimRange[1]));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [trimRange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const dur = video.duration || 0;
      setDuration(dur);
      setVideoDimensions({
        width: video.videoWidth,
        height: video.videoHeight,
      });
      // Default trim range: 0 to min(dur, 60)
      setTrimRange([0, Math.min(dur, 60)]);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Loop within trim range
      if (video.currentTime >= trimRange[1]) {
        video.currentTime = trimRange[0];
        if (!isPlaying) {
          video.pause();
        }
      }
    };

    const handleEnded = () => {
      video.currentTime = trimRange[0];
      video.play().catch(() => {});
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [trimRange, isPlaying]);

  return {
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
  };
}
