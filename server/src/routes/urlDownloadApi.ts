import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { FastifyPluginAsync } from 'fastify';
import { tempManager } from '../storage/tempManager.js';
import { probeMedia } from '../ffmpeg/probe.js';

export const urlDownloadRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: {
      url: string;
    };
  }>('/api/download-url', async (request, reply) => {
    const { url } = request.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return reply.code(400).send({ error: 'Please provide a valid HTTP or HTTPS video URL.' });
    }

    try {
      const parsedUrl = new URL(url);
      const urlExt = path.extname(parsedUrl.pathname) || '.mp4';
      const cleanExt = ['.mp4', '.mov', '.webm', '.m4v'].includes(urlExt.toLowerCase())
        ? urlExt
        : '.mp4';

      const { id, filePath } = tempManager.createFilePath(cleanExt);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ClipRound-Downloader/1.0',
        },
      });

      if (!response.ok || !response.body) {
        return reply.code(400).send({
          error: `Failed to download media from URL (HTTP ${response.status}: ${response.statusText})`,
        });
      }

      const fileStream = fs.createWriteStream(filePath);
      // @ts-ignore
      await pipeline(Readable.fromWeb(response.body), fileStream);

      const baseName = path.basename(parsedUrl.pathname) || `url_video${cleanExt}`;
      const stored = tempManager.registerFile(id, filePath, baseName, 'video/mp4');

      let metadata = null;
      try {
        metadata = await probeMedia(filePath);
      } catch {
        // Probe fallback
      }

      return reply.send({
        success: true,
        id: stored.id,
        fileName: stored.fileName,
        fileSize: stored.fileSize,
        url: `/api/media/${stored.id}`,
        metadata,
      });
    } catch (err) {
      return reply.code(500).send({
        success: false,
        error: `URL download error: ${(err as Error).message}`,
      });
    }
  });
};
