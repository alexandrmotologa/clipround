import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { generateVideoNote } from '../src/ffmpeg/videoNote.js';
import { compressVideo } from '../src/ffmpeg/compressor.js';
import { extractAudio } from '../src/ffmpeg/audioExtractor.js';
import { probeMedia } from '../src/ffmpeg/probe.js';

const TEST_DIR = path.resolve(__dirname, 'fixtures');
const DEMO_SAMPLE = path.resolve(__dirname, '../../demo/sample.mp4');
const TEST_INPUT = path.join(TEST_DIR, 'input_sample.mp4');
const TEST_OUTPUT_ROUND = path.join(TEST_DIR, 'output_round.mp4');
const TEST_OUTPUT_COMPRESS = path.join(TEST_DIR, 'output_compressed.mp4');
const TEST_OUTPUT_AUDIO = path.join(TEST_DIR, 'output_audio.mp3');

beforeAll(() => {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }

  // Copy bundled demo video as test input
  if (fs.existsSync(DEMO_SAMPLE)) {
    fs.copyFileSync(DEMO_SAMPLE, TEST_INPUT);
  } else {
    throw new Error(`Bundled sample video not found at ${DEMO_SAMPLE}`);
  }
});

afterAll(() => {
  try {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
});

describe('FFmpeg Transcoding Pipeline', () => {
  it('transcodes rectangular video into Telegram circular video note format', async () => {
    await generateVideoNote({
      inputPath: TEST_INPUT,
      outputPath: TEST_OUTPUT_ROUND,
      startTimeSec: 0,
      durationSec: 3,
      cropX: 280, // Center crop 720 from 1280: (1280-720)/2 = 280
      cropY: 0,
      cropSize: 720,
      audioBoostFactor: 1.0,
      targetDimension: 480,
    });

    expect(fs.existsSync(TEST_OUTPUT_ROUND)).toBe(true);

    const probe = await probeMedia(TEST_OUTPUT_ROUND);
    expect(probe.width).toBe(480);
    expect(probe.height).toBe(480);
    expect(probe.videoCodec).toBe('h264');
    expect(probe.audioCodec).toBe('aac');
    expect(probe.duration).toBeGreaterThan(2);
    expect(probe.duration).toBeLessThanOrEqual(4);
  });

  it('compresses video using preset', async () => {
    await compressVideo({
      inputPath: TEST_INPUT,
      outputPath: TEST_OUTPUT_COMPRESS,
      preset: 'telegram10',
    });

    expect(fs.existsSync(TEST_OUTPUT_COMPRESS)).toBe(true);
    const probe = await probeMedia(TEST_OUTPUT_COMPRESS);
    expect(probe.videoCodec).toBe('h264');
    expect(probe.sizeBytes).toBeGreaterThan(0);
  });

  it('extracts audio track to MP3', async () => {
    await extractAudio({
      inputPath: TEST_INPUT,
      outputPath: TEST_OUTPUT_AUDIO,
      format: 'mp3',
    });

    expect(fs.existsSync(TEST_OUTPUT_AUDIO)).toBe(true);
    const stat = fs.statSync(TEST_OUTPUT_AUDIO);
    expect(stat.size).toBeGreaterThan(1000);
  });
});
