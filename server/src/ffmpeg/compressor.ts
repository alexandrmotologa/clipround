import ffmpeg from 'fluent-ffmpeg';
import { probeMedia } from './probe.js';

export interface CompressOptions {
  inputPath: string;
  outputPath: string;
  preset?: 'telegram10' | 'telegram25' | 'telegram50' | 'custom';
  targetSizeMb?: number;
  crf?: number;
  scaleWidth?: number;
  audioBitrate?: string;
}

export async function compressVideo(opts: CompressOptions): Promise<void> {
  const probe = await probeMedia(opts.inputPath);
  const duration = Math.max(1, probe.duration);

  let targetMb = opts.targetSizeMb;
  if (!targetMb) {
    if (opts.preset === 'telegram10') targetMb = 9.5;
    else if (opts.preset === 'telegram25') targetMb = 24.0;
    else if (opts.preset === 'telegram50') targetMb = 48.0;
  }

  return new Promise((resolve, reject) => {
    const command = ffmpeg(opts.inputPath);

    if (targetMb) {
      // Calculate target video bitrate: total bits = targetMb * 8 * 1024 * 1024
      const audioBitrateK = 128;
      const totalBitrateK = (targetMb * 8192) / duration;
      const videoBitrateK = Math.max(200, Math.floor(totalBitrateK - audioBitrateK));

      command
        .videoCodec('libx264')
        .videoBitrate(`${videoBitrateK}k`)
        .outputOptions([
          '-preset medium',
          '-pix_fmt yuv420p',
          '-movflags +faststart',
        ]);
    } else {
      const crfValue = opts.crf !== undefined ? opts.crf : 26;
      command
        .videoCodec('libx264')
        .outputOptions([
          '-preset fast',
          `-crf ${crfValue}`,
          '-pix_fmt yuv420p',
          '-movflags +faststart',
        ]);
    }

    if (opts.scaleWidth && opts.scaleWidth < probe.width) {
      command.videoFilters(`scale=${opts.scaleWidth}:-2`);
    }

    command
      .audioCodec('aac')
      .audioBitrate(opts.audioBitrate || '128k')
      .output(opts.outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}
