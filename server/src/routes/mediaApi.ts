import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { FastifyPluginAsync } from 'fastify';
import { tempManager } from '../storage/tempManager.js';
import { probeMedia } from '../ffmpeg/probe.js';
import { generateVideoNote } from '../ffmpeg/videoNote.js';
import { compressVideo } from '../ffmpeg/compressor.js';
import { extractAudio } from '../ffmpeg/audioExtractor.js';
import { validateTelegramInitData } from '../security/auth.js';
import { getBotInstance } from '../bot/bot.js';
import { InputFile } from 'grammy';

export const mediaRoutes: FastifyPluginAsync = async (fastify) => {
  // Upload raw video
  fastify.post('/api/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No video file provided' });
    }

    const ext = path.extname(data.filename) || '.mp4';
    const { id, filePath } = tempManager.createFilePath(ext);

    await pipeline(data.file, fs.createWriteStream(filePath));
    const stored = tempManager.registerFile(id, filePath, data.filename, data.mimetype);

    let probe = null;
    try {
      probe = await probeMedia(filePath);
    } catch {
      // Allow probe to fail gracefully if ffprobe cannot read
    }

    return reply.send({
      id: stored.id,
      fileName: stored.fileName,
      fileSize: stored.fileSize,
      url: `/api/media/${stored.id}`,
      metadata: probe,
    });
  });

  // Probe media details
  fastify.get<{ Params: { id: string } }>('/api/probe/:id', async (request, reply) => {
    const { id } = request.params;
    const file = tempManager.getFile(id);
    if (!file) {
      return reply.code(404).send({ error: 'Media file not found' });
    }

    try {
      const probe = await probeMedia(file.filePath);
      return reply.send(probe);
    } catch (err) {
      return reply.code(500).send({ error: (err as Error).message });
    }
  });

  // Process circular video note
  fastify.post<{
    Body: {
      mediaId: string;
      startTime?: number;
      duration?: number;
      cropX: number;
      cropY: number;
      cropSize: number;
      audioBoost?: number;
      targetDimension?: number;
    };
  }>('/api/process/round', async (request, reply) => {
    const { mediaId, startTime = 0, duration = 60, cropX, cropY, cropSize, audioBoost = 1.0, targetDimension = 480 } = request.body;

    const sourceFile = tempManager.getFile(mediaId);
    if (!sourceFile) {
      return reply.code(404).send({ error: 'Source media not found or expired' });
    }

    const { id: outputId, filePath: outputPath } = tempManager.createFilePath('mp4');

    try {
      await generateVideoNote({
        inputPath: sourceFile.filePath,
        outputPath,
        startTimeSec: startTime,
        durationSec: duration,
        cropX,
        cropY,
        cropSize,
        audioBoostFactor: audioBoost,
        targetDimension,
      });

      const processed = tempManager.registerFile(
        outputId,
        outputPath,
        `round-${outputId}.mp4`,
        'video/mp4'
      );

      const probe = await probeMedia(outputPath);

      return reply.send({
        success: true,
        id: processed.id,
        url: `/api/media/${processed.id}`,
        fileSize: processed.fileSize,
        duration: probe.duration,
        width: probe.width,
        height: probe.height,
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: `Transcoding failed: ${(err as Error).message}`,
      });
    }
  });

  // Compress video
  fastify.post<{
    Body: {
      mediaId: string;
      preset?: 'telegram10' | 'telegram25' | 'telegram50' | 'custom';
      targetSizeMb?: number;
      crf?: number;
    };
  }>('/api/process/compress', async (request, reply) => {
    const { mediaId, preset, targetSizeMb, crf } = request.body;

    const sourceFile = tempManager.getFile(mediaId);
    if (!sourceFile) {
      return reply.code(404).send({ error: 'Source media not found' });
    }

    const { id: outputId, filePath: outputPath } = tempManager.createFilePath('mp4');

    try {
      await compressVideo({
        inputPath: sourceFile.filePath,
        outputPath,
        preset,
        targetSizeMb,
        crf,
      });

      const processed = tempManager.registerFile(
        outputId,
        outputPath,
        `compressed-${outputId}.mp4`,
        'video/mp4'
      );

      const probe = await probeMedia(outputPath);

      return reply.send({
        success: true,
        id: processed.id,
        url: `/api/media/${processed.id}`,
        fileSize: processed.fileSize,
        duration: probe.duration,
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: `Compression failed: ${(err as Error).message}`,
      });
    }
  });

  // Extract audio
  fastify.post<{
    Body: {
      mediaId: string;
      format?: 'mp3' | 'aac';
      bitrate?: string;
    };
  }>('/api/process/extract', async (request, reply) => {
    const { mediaId, format = 'mp3', bitrate = '192k' } = request.body;

    const sourceFile = tempManager.getFile(mediaId);
    if (!sourceFile) {
      return reply.code(404).send({ error: 'Source media not found' });
    }

    const { id: outputId, filePath: outputPath } = tempManager.createFilePath(format);

    try {
      await extractAudio({
        inputPath: sourceFile.filePath,
        outputPath,
        format,
        bitrate,
      });

      const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/aac';
      const processed = tempManager.registerFile(
        outputId,
        outputPath,
        `audio-${outputId}.${format}`,
        mimeType
      );

      return reply.send({
        success: true,
        id: processed.id,
        url: `/api/media/${processed.id}`,
        fileSize: processed.fileSize,
        format,
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: `Audio extraction failed: ${(err as Error).message}`,
      });
    }
  });

  // Send result back to Telegram chat as Video Note
  fastify.post<{
    Body: {
      mediaId: string;
      chatId?: number | string;
      initData?: string;
    };
  }>('/api/send-telegram', async (request, reply) => {
    const { mediaId, chatId, initData } = request.body;
    const bot = getBotInstance();

    if (!bot) {
      return reply.code(503).send({
        error: 'Telegram Bot is running in offline studio mode. No bot token configured.',
      });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    const isDemo = process.env.DEMO_MODE === 'true';
    const auth = validateTelegramInitData(initData, token, isDemo);

    const targetChatId = chatId || auth.user?.id;
    if (!targetChatId) {
      return reply.code(400).send({ error: 'Missing Telegram target chatId or user session' });
    }

    const file = tempManager.getFile(mediaId);
    if (!file) {
      return reply.code(404).send({ error: 'Processed media file not found' });
    }

    try {
      await bot.api.sendVideoNote(targetChatId, new InputFile(file.filePath));
      return reply.send({ success: true, message: 'Video note sent to Telegram successfully' });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: `Failed to send to Telegram: ${(err as Error).message}`,
      });
    }
  });
};
