import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import type { Context } from 'grammy';
import { InlineKeyboard, InputFile } from 'grammy';
import { tempManager } from '../storage/tempManager.js';
import { probeMedia } from '../ffmpeg/probe.js';
import { compressVideo } from '../ffmpeg/compressor.js';
import { extractAudio } from '../ffmpeg/audioExtractor.js';

export async function handleIncomingVideo(ctx: Context): Promise<void> {
  const video = ctx.message?.video || ctx.message?.document;
  if (!video) return;

  const statusMsg = await ctx.reply('Downloading video...');

  try {
    const file = await ctx.getFile();
    if (!file.file_path) {
      await ctx.api.editMessageText(ctx.chat!.id, statusMsg.message_id, 'Failed to resolve Telegram video download path.');
      return;
    }

    const { id, filePath } = tempManager.createFilePath('mp4');
    const downloadUrl = `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`;

    const res = await fetch(downloadUrl);
    if (!res.ok || !res.body) {
      throw new Error(`Failed to download from Telegram servers: ${res.statusText}`);
    }

    const fileStream = fs.createWriteStream(filePath);
    const { Readable } = await import('node:stream');
    // @ts-ignore
    await pipeline(Readable.fromWeb(res.body), fileStream);

    const stored = tempManager.registerFile(id, filePath, 'telegram_upload.mp4', 'video/mp4');
    const probe = await probeMedia(filePath);

    const sizeMb = (stored.fileSize / (1024 * 1024)).toFixed(1);
    const duration = Math.round(probe.duration);
    const webAppBase = process.env.TELEGRAM_WEBAPP_URL || 'http://localhost:8080';
    const webAppUrl = `${webAppBase}?mediaId=${stored.id}`;

    const keyboard = new InlineKeyboard()
      .webApp('🔵 Open Round Crop Studio', webAppUrl)
      .row()
      .text('📉 Compress (10MB)', `compress_${stored.id}`)
      .text('🎵 Extract MP3', `extract_${stored.id}`);

    await ctx.api.editMessageText(
      ctx.chat!.id,
      statusMsg.message_id,
      `Video received (${sizeMb} MB, ${duration}s, ${probe.width}x${probe.height}).\n\nChoose an action:`,
      { reply_markup: keyboard }
    );
  } catch (err) {
    await ctx.api.editMessageText(
      ctx.chat!.id,
      statusMsg.message_id,
      `Error processing video: ${(err as Error).message}`
    );
  }
}

export async function handleCallbackQuery(ctx: Context): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  await ctx.answerCallbackQuery();

  if (data.startsWith('compress_')) {
    const mediaId = data.replace('compress_', '');
    const sourceFile = tempManager.getFile(mediaId);
    if (!sourceFile) {
      await ctx.reply('Media expired or not found. Please upload again.');
      return;
    }

    const statusMsg = await ctx.reply('Compressing video to under 10 MB...');
    const { id: outputId, filePath: outputPath } = tempManager.createFilePath('mp4');

    try {
      await compressVideo({
        inputPath: sourceFile.filePath,
        outputPath,
        preset: 'telegram10',
      });

      const processed = tempManager.registerFile(outputId, outputPath, 'compressed.mp4', 'video/mp4');
      const mb = (processed.fileSize / (1024 * 1024)).toFixed(2);

      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id);
      await ctx.replyWithVideo(new InputFile(outputPath), {
        caption: `Compressed to ${mb} MB with ClipRound`,
      });
    } catch (err) {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        `Compression error: ${(err as Error).message}`
      );
    }
  } else if (data.startsWith('extract_')) {
    const mediaId = data.replace('extract_', '');
    const sourceFile = tempManager.getFile(mediaId);
    if (!sourceFile) {
      await ctx.reply('Media expired or not found. Please upload again.');
      return;
    }

    const statusMsg = await ctx.reply('Extracting MP3 audio track...');
    const { id: outputId, filePath: outputPath } = tempManager.createFilePath('mp3');

    try {
      await extractAudio({
        inputPath: sourceFile.filePath,
        outputPath,
        format: 'mp3',
      });

      tempManager.registerFile(outputId, outputPath, 'audio.mp3', 'audio/mpeg');

      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id);
      await ctx.replyWithAudio(new InputFile(outputPath), {
        caption: 'Audio extracted with ClipRound',
      });
    } catch (err) {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        `Extraction error: ${(err as Error).message}`
      );
    }
  }
}
