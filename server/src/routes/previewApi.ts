import fs from 'node:fs';
import path from 'node:path';
import type { FastifyPluginAsync } from 'fastify';
import { tempManager } from '../storage/tempManager.js';

export const previewRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { id: string } }>('/api/media/:id', async (request, reply) => {
    const { id } = request.params;
    const file = tempManager.getFile(id);

    if (!file || !fs.existsSync(file.filePath)) {
      return reply.code(404).send({ error: 'Media file not found or expired' });
    }

    const stat = fs.statSync(file.filePath);
    const fileSize = stat.size;
    const range = request.headers.range;

    const mimeType = file.mimeType || 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = Number.parseInt(parts[0], 10);
      const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        return reply
          .code(416)
          .header('Content-Range', `bytes */${fileSize}`)
          .send('Requested range not satisfiable');
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(file.filePath, { start, end });

      return reply
        .code(206)
        .header('Content-Range', `bytes ${start}-${end}/${fileSize}`)
        .header('Accept-Ranges', 'bytes')
        .header('Content-Length', chunkSize)
        .header('Content-Type', mimeType)
        .send(fileStream);
    }

    return reply
      .header('Content-Length', fileSize)
      .header('Content-Type', mimeType)
      .header('Accept-Ranges', 'bytes')
      .header('Cache-Control', 'public, max-age=3600')
      .send(fs.createReadStream(file.filePath));
  });

  fastify.get('/api/demo', async (_request, reply) => {
    // Check multiple potential paths for sample.mp4
    const candidates = [
      path.resolve(process.cwd(), '../demo/sample.mp4'),
      path.resolve(process.cwd(), 'demo/sample.mp4'),
      path.resolve(process.cwd(), './demo/sample.mp4'),
      path.resolve(process.cwd(), '../web/public/sample.mp4'),
    ];

    let demoPath: string | null = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        demoPath = p;
        break;
      }
    }

    if (!demoPath) {
      return reply.code(404).send({ error: 'Demo video not found' });
    }

    // Register demo in tempManager with fixed ID 'demo'
    const stored = tempManager.registerFile('demo', demoPath, 'sample.mp4', 'video/mp4');

    return reply.send({
      id: stored.id,
      fileName: stored.fileName,
      url: `/api/media/${stored.id}`,
      fileSize: stored.fileSize,
    });
  });
};
