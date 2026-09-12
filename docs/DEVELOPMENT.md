# Development Guide

This guide describes how to run, test, and contribute to ClipRound locally.

## Project Structure

- `server/`: Fastify REST API, grammY bot client, and FFmpeg transcoding wrappers.
- `web/`: React 19 single-page application built with Vite and Tailwind CSS.
- `demo/`: Bundled video assets used for automated testing and quick visual checks.
- `docs/`: System documentation, architecture diagrams, and format specifications.

## Prerequisites

- Node.js 20+
- FFmpeg 6.0+ (with libx264 and aac enabled)
- Git

Verify your FFmpeg installation by running:

```bash
ffmpeg -version
ffprobe -version
```

## Running the Server Locally

1. Navigate to the server folder and install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Start the server in watch mode:
   ```bash
   npm run dev
   ```

The server listens on `http://localhost:8080`. When `TELEGRAM_BOT_TOKEN=mock_token` or unset, the server runs in local studio mode without attempting to connect to Telegram's long-polling gateway.

## Running the Web Studio Locally

1. In a separate terminal, navigate to the web folder:
   ```bash
   cd web
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

The web studio runs on `http://localhost:5173` and proxies API requests to `http://localhost:8080`.

## Automated Tests

To run the unit tests and verify the transcoding pipeline:

```bash
cd server
npm test
```

The test runner will:
1. Synthesize a test video with known audio and video parameters using native FFmpeg.
2. Run the circular video note transcoder with custom crop offsets and duration limits.
3. Inspect the produced MP4 file with `ffprobe` to verify that the container, codec, resolution (480x480), and SAR (1:1) match Telegram requirements.
4. Verify the automatic storage cleanup logic.

## Building for Production

To build both packages for production deployment:

```bash
# Build server
cd server
npm run build

# Build web
cd ../web
npm run build
```
