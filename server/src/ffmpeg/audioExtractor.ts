import ffmpeg from 'fluent-ffmpeg';

export interface ExtractAudioOptions {
  inputPath: string;
  outputPath: string;
  format?: 'mp3' | 'aac';
  bitrate?: string;
}

export function extractAudio(opts: ExtractAudioOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const format = opts.format || 'mp3';
    const bitrate = opts.bitrate || '192k';

    const command = ffmpeg(opts.inputPath).noVideo();

    if (format === 'mp3') {
      command.audioCodec('libmp3lame').audioBitrate(bitrate);
    } else {
      command.audioCodec('aac').audioBitrate(bitrate);
    }

    command
      .output(opts.outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}
