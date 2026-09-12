import ffmpeg from 'fluent-ffmpeg';

export interface MediaProbeResult {
  duration: number;
  width: number;
  height: number;
  videoCodec: string;
  audioCodec?: string;
  bitrate: number;
  sizeBytes: number;
  aspectRatio: string;
}

export function probeMedia(filePath: string): Promise<MediaProbeResult> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) {
        return reject(err);
      }

      const videoStream = data.streams.find((s) => s.codec_type === 'video');
      const audioStream = data.streams.find((s) => s.codec_type === 'audio');

      const width = videoStream?.width || 0;
      const height = videoStream?.height || 0;
      const duration = Number(data.format.duration || videoStream?.duration || 0);
      const bitrate = Number(data.format.bit_rate || videoStream?.bit_rate || 0);
      const sizeBytes = Number(data.format.size || 0);
      const videoCodec = videoStream?.codec_name || 'unknown';
      const audioCodec = audioStream?.codec_name;

      let aspectRatio = '1:1';
      if (width > 0 && height > 0) {
        aspectRatio = `${width}:${height}`;
      }

      resolve({
        duration,
        width,
        height,
        videoCodec,
        audioCodec,
        bitrate,
        sizeBytes,
        aspectRatio,
      });
    });
  });
}
