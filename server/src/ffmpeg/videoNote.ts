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
}

export function generateVideoNote(opts: ProcessRoundOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Math.max(0, opts.startTimeSec || 0);
    const duration = Math.min(Math.max(1, opts.durationSec || 60), 60);
    const targetSize = opts.targetDimension || 480;
    const cropSize = Math.max(32, Math.round(opts.cropSize));
    const cropX = Math.max(0, Math.round(opts.cropX));
    const cropY = Math.max(0, Math.round(opts.cropY));
    const audioBoost = opts.audioBoostFactor !== undefined ? opts.audioBoostFactor : 1.0;

    const command = ffmpeg(opts.inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .videoFilters([
        `crop=${cropSize}:${cropSize}:${cropX}:${cropY}`,
        `scale=${targetSize}:${targetSize}`,
        'setsar=1:1',
      ])
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

      if (Math.abs(audioBoost - 1.0) > 0.05) {
        command.audioFilters(`volume=${audioBoost.toFixed(2)}`);
      }
    }

    command
      .output(opts.outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}
