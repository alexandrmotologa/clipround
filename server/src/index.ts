import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { mediaRoutes } from './routes/mediaApi.js';
import { previewRoutes } from './routes/previewApi.js';
import { urlDownloadRoutes } from './routes/urlDownloadApi.js';
import { initTelegramBot } from './bot/bot.js';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function main() {
  // Setup CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Setup Multipart for video uploads
  const maxMb = Number.parseInt(process.env.MAX_UPLOAD_SIZE_MB || '100', 10);
  await fastify.register(multipart, {
    limits: {
      fileSize: maxMb * 1024 * 1024,
    },
  });

  // Health check
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'clipround-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      demoMode: process.env.DEMO_MODE === 'true',
    };
  });

  // Register API routes
  await fastify.register(previewRoutes);
  await fastify.register(mediaRoutes);
  await fastify.register(urlDownloadRoutes);

  // Serve static web build if present
  const staticCandidates = [
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), '../web/dist'),
    path.resolve(process.cwd(), 'web/dist'),
  ];

  let staticRoot: string | null = null;
  for (const dir of staticCandidates) {
    if (fs.existsSync(dir)) {
      staticRoot = dir;
      break;
    }
  }

  if (staticRoot) {
    fastify.log.info(`Serving static frontend assets from ${staticRoot}`);
    await fastify.register(fastifyStatic, {
      root: staticRoot,
      prefix: '/',
    });

    // Fallback for SPA routing
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api')) {
        return reply.code(404).send({ error: 'Endpoint not found' });
      }
      const indexPath = path.join(staticRoot!, 'index.html');
      if (fs.existsSync(indexPath)) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not found' });
    });
  }

  const port = Number.parseInt(process.env.PORT || '8080', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await fastify.listen({ port, host });
    console.log(`[ClipRound] Server listening on http://${host}:${port}`);

    // Start bot long-polling
    await initTelegramBot();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
