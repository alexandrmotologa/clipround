import ffmpeg from 'fluent-ffmpeg';

export interface ProcessRoundOptions {
  inputPath: string;
  outputPath: string;
  startTimeSec?: number;
  durationSec?: number;
  cropX: number;
  cropY: number;
  cropSize: number;
  audioBoostFactor?: number;
  targetDimension?: number;
  speedMultiplier?: number;
  flipHorizontal?: boolean;
  loudnorm?: boolean;
  colorPreset?: 'none' | 'vivid' | 'bw' | 'warm' | 'cool';
  textOverlay?: string;
}

export function generateVideoNote(opts: ProcessRoundOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Math.max(0, opts.startTimeSec || 0);
    const rawDuration = Math.max(0.5, opts.durationSec || 60);
    const speed = Math.max(0.5, Math.min(2.0, opts.speedMultiplier || 1.0));
    // When speed increases, output duration is rawDuration / speed (capped at 60s for Telegram)
    const outputDuration = Math.min(60, rawDuration / speed);
    const targetSize = opts.targetDimension || 480;
    const cropSize = Math.max(32, Math.round(opts.cropSize));
    const cropX = Math.max(0, Math.round(opts.cropX));
    const cropY = Math.max(0, Math.round(opts.cropY));
    const audioBoost = opts.audioBoostFactor !== undefined ? opts.audioBoostFactor : 1.0;

    const videoFilterList: string[] = [
      `crop=${cropSize}:${cropSize}:${cropX}:${cropY}`,
      `scale=${targetSize}:${targetSize}`,
      'setsar=1:1',
    ];

    if (opts.flipHorizontal) {
      videoFilterList.push('hflip');
    }

    if (opts.colorPreset === 'vivid') {
      videoFilterList.push('eq=contrast=1.15:brightness=0.02:saturation=1.3');
    } else if (opts.colorPreset === 'bw') {
      videoFilterList.push('hue=s=0,eq=contrast=1.2');
    } else if (opts.colorPreset === 'warm') {
      videoFilterList.push('colorbalance=rs=0.08:gs=0.04:bs=-0.08');
    } else if (opts.colorPreset === 'cool') {
      videoFilterList.push('colorbalance=rs=-0.08:gs=0.02:bs=0.08');
    }

    if (speed !== 1.0) {
      const ptsRatio = (1.0 / speed).toFixed(4);
      videoFilterList.push(`setpts=${ptsRatio}*PTS`);
    }

    if (opts.textOverlay && opts.textOverlay.trim()) {
      // Clean string for drawtext filter
      const safeText = opts.textOverlay
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/:/g, '\\:')
        .slice(0, 50);

      videoFilterList.push(
        `drawtext=text='${safeText}':x=(w-text_w)/2:y=h-th-32:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=8`
      );
    }

    const command = ffmpeg(opts.inputPath)
      .setStartTime(startTime)
      .setDuration(outputDuration)
      .videoFilters(videoFilterList)
      .videoCodec('libx264')
      .outputOptions([
        '-profile:v baseline',
        '-level 3.1',
        '-preset fast',
        '-crf 23',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
      ]);

    if (audioBoost <= 0.01) {
      command.noAudio();
    } else {
      command
        .audioCodec('aac')
        .audioBitrate('128k')
        .audioChannels(2)
        .audioFrequency(44100);

      const audioFilterList: string[] = [];

      if (speed !== 1.0) {
        audioFilterList.push(`atempo=${speed.toFixed(2)}`);
      }

      if (opts.loudnorm) {
        audioFilterList.push('loudnorm=I=-16:TP=-1.5:LRA=11');
      }

      if (Math.abs(audioBoost - 1.0) > 0.05) {
        audioFilterList.push(`volume=${audioBoost.toFixed(2)}`);
      }

      if (audioFilterList.length > 0) {
        command.audioFilters(audioFilterList);
      }
    }

    command
      .output(opts.outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}
