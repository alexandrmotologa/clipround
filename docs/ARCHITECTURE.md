# Architecture Overview

ClipRound coordinates three core parts: a media transcoding pipeline based on FFmpeg, an HTTP API built on Fastify, and an interactive front-end web studio built with React and Vite.

```
                    +--------------------------------+
                    |  Telegram Client / Web Browser |
                    +---------------+----------------+
                                    |
          Uploads / Actions         |         Web App Launch / REST API
                                    v
                    +---------------+----------------+
                    |       Fastify HTTP Server      |
                    |  (Routes, Auth, Ephemeral FS)  |
                    +---------------+----------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------+-----------+                       +-----------+-----------+
|    grammY Bot Layer   |                       |    FFmpeg Transcoder  |
|  (Long Polling Loop)  |                       |  (Crops, CRF, Audio)  |
+-----------------------+                       +-----------------------+
```

## System Components

### 1. Fastify HTTP Server

The backend runs on Fastify and TypeScript. It handles multipart file uploads, provides access to temporary media files, validates Telegram `initData` when running inside a Telegram WebApp window, and exposes endpoints for transcoding operations.

Key routes:
- `POST /api/upload`: Receives uploaded video clips up to 100 MB.
- `POST /api/process/round`: Crops, trims, and converts video to 1:1 circular format.
- `POST /api/process/compress`: Compresses video with adaptive CRF or target bitrates.
- `POST /api/process/extract`: Extracts audio track as MP3 or AAC.
- `GET /api/media/:id`: Streams processed video files with partial HTTP range request support.
- `GET /api/health`: Returns service status and verifies FFmpeg presence on the host system.

### 2. FFmpeg Media Pipeline

All transcoding is executed through native FFmpeg processes spawned via `fluent-ffmpeg`. The pipeline enforces specific encoding parameters:

- Video Note generation: Uses `crop` and `scale=480:480` filters, `libx264` with `yuv420p` pixel format, `-movflags +faststart` for immediate streaming, and `aac` audio at 128 kbps.
- Video Compression: Calculates target bitrates based on duration and desired file size (for example, under 10 MB or 25 MB). It applies `crf` controls (23 to 32) and modern presets to retain visual clarity.
- Audio Extraction: Strips video streams (`-vn`) and encodes directly to 192 kbps MP3 or copy/AAC.

### 3. Ephemeral Storage Manager

Uploaded videos and generated outputs are stored in a dedicated temporary folder (`storage/temp`). An automatic interval runs every 15 minutes to delete any file older than the configured threshold (default: 60 minutes). This prevents disk exhaustion on long-running servers.

### 4. grammY Bot Layer

The bot uses Telegram's long-polling mechanism (`getUpdates`), which eliminates the need for a public HTTPS domain or webhook reverse proxy. When a user sends or forwards a video to the bot:
1. The bot downloads the file to temporary storage.
2. The bot sends back inline buttons with direct options: crop to round video note, compress, or rip audio.
3. If the user chooses to crop, the bot provides a direct link or Mini App button to open the web studio with the video ID preloaded.
4. Once processed, the bot sends the finished file back using `sendVideoNote`.

### 5. Web Studio (React 19 + Vite)

The web studio is an interactive single-page application. It provides:
- A circular viewfinder mask that allows panning and zooming the video to center faces or subjects.
- A timeline trimmer slider with 0.1-second precision and real-time second counters.
- Playback controls synchronized with timeline markers.
- Telegram WebApp SDK integration for haptic feedback and native main-button triggers.
- A standalone fallback mode that works directly in any desktop browser without Telegram headers.
