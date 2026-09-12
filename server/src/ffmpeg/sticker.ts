import ffmpeg from 'fluent-ffmpeg';

export interface ProcessStickerOptions {
  inputPath: string;
  outputPath: string;
  startTimeSec?: number;
  durationSec?: number;
  cropX: number;
  cropY: number;
  cropSize: number;
  format?: 'webm' | 'gif';
  dimension?: number;
}

export function generateSticker(opts: ProcessStickerOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Math.max(0, opts.startTimeSec || 0);
    // Stickers are typically 3 seconds max
    const duration = Math.min(Math.max(0.5, opts.durationSec || 3), 3);
    const targetSize = opts.dimension || 512;
    const cropSize = Math.max(32, Math.round(opts.cropSize));
    const cropX = Math.max(0, Math.round(opts.cropX));
    const cropY = Math.max(0, Math.round(opts.cropY));
    const format = opts.format || 'webm';

    const command = ffmpeg(opts.inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .noAudio();

    if (format === 'webm') {
      command
        .videoFilters([
          `crop=${cropSize}:${cropSize}:${cropX}:${cropY}`,
          `scale=${targetSize}:${targetSize}`,
          'setsar=1:1',
          'fps=30',
        ])
        .videoCodec('libvpx-vp9')
        .outputOptions([
          '-crf 30',
          '-b:v 0',
          '-pix_fmt yuv420p',
        ]);
    } else {
      command
        .videoFilters([
          `crop=${cropSize}:${cropSize}:${cropX}:${cropY}`,
          `scale=${targetSize}:${targetSize}`,
          'setsar=1:1',
          'fps=15',
        ]);
    }

    command
      .output(opts.outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}
