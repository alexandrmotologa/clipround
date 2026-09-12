<p align="center">
  <img src="docs/images/logo.png?raw=true" alt="ClipRound Logo" width="130" style="border-radius: 24px;" />
</p>

<h1 align="center">ClipRound</h1>

<p align="center">
  <strong>Circular Telegram Video Note Studio, Video Compressor & Audio Ripper</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Fastify-5.x-black?style=flat-square&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/FFmpeg-8.x-007808?style=flat-square&logo=ffmpeg&logoColor=white" alt="FFmpeg" />
  <img src="https://img.shields.io/badge/grammY-Telegram_Bot-24A1DE?style=flat-square&logo=telegram&logoColor=white" alt="Telegram Bot" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
</p>

---

ClipRound converts standard video files into official circular Telegram video notes, compresses oversized media for mobile chat sharing, and extracts audio tracks. It runs as both a Telegram Mini App connected to a long-polling bot and as a standalone web studio for local editing in any desktop or mobile browser.

ClipRound uses the **Oculus Owl** mascot because of the owl's distinctive circular facial disc, capturing and focusing audio and visual streams into an exact circular aperture with pin-point precision.

## Screenshots

<p align="center">
  <img src="docs/images/screenshot_circular_studio.png?raw=true" alt="ClipRound Circular Viewfinder Studio" width="850" />
</p>

<p align="center">
  <em>Interactive 1:1 circular viewfinder studio with waveform timeline trimmer, playback speed controls, and color grading</em>
</p>

<p align="center">
  <img src="docs/images/screenshot_compressor.png?raw=true" alt="ClipRound Smart Video Compressor" width="850" />
</p>

<p align="center">
  <em>Smart video compressor with quick Telegram mobile sharing presets and custom CRF tuning</em>
</p>

## Features

- Converts rectangular videos into 1:1 square MP4 files formatted specifically for Telegram circular video notes (`sendVideoNote`).
- In-studio camera recorder allowing users to record their webcam directly inside the 1:1 circular frame with a 60-second limit and countdown.
- Interactive circular viewfinder with drag-to-pan and zoom controls to frame subjects accurately.
- Timeline trimmer with Web Audio API waveform visualization and frame-stepping controls (0.1s precision).
- Playback speed adjustment (0.5x, 0.75x, 1.0x, 1.25x, 1.5x, 2.0x) to fit longer clips into Telegram's 60-second limit.
- Horizontal mirror toggle to fix flipped selfie camera recordings.
- Speech normalizer based on EBU R128 (`loudnorm`) and manual audio gain up to 2.5x.
- Burn-in text captions and color grading presets (Vivid, B&W, Warm Vintage, Cool Breeze).
- Circular animated sticker export (`.webm` with VP9) for sticker sets.
- Direct URL video downloader to fetch web clips without local downloading.
- Video compressor with presets for Telegram size limits (10 MB, 25 MB, 50 MB) and custom CRF controls.
- Audio track ripper supporting MP3 and AAC.
- Standalone browser studio with a pre-loaded sample video for local testing without bot tokens or external domains.
- Automatic disk cleanup for ephemeral media after 60 minutes.

## Technical Requirements

- Node.js 20 or higher
- Native FFmpeg and FFprobe installed on the system path
- Docker and Docker Compose (optional for containerized deployment)
- Telegram Bot Token from @BotFather (optional for Telegram chat delivery)

## Quick Start

### 1. Clone and install dependencies

```bash
git clone https://github.com/alexandrmotologa/clipround.git
cd clipround

# Install server dependencies
cd server
npm install

# Install web client dependencies
cd ../web
npm install
cd ..
```

### 2. Configure environment variables

Copy the example configuration:

```bash
cp .env.example .env
```

To run purely locally in demo mode without Telegram credentials, keep:

```env
TELEGRAM_BOT_TOKEN=mock_token
DEMO_MODE=true
PORT=8080
```

### 3. Run the development environment

In terminal 1 (server):

```bash
cd server
npm run dev
```

In terminal 2 (web frontend):

```bash
cd web
npm run dev
```

Open `http://localhost:5173` in your browser. The studio will open with the bundled demo video pre-loaded.

## Docker Deployment

To run the complete stack in a single container with native FFmpeg included:

```bash
docker compose up --build
```

Access the application at `http://localhost:8080`.

## Telegram Bot Integration

To connect the bot to Telegram:

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy the bot token.
2. In `.env`, set `TELEGRAM_BOT_TOKEN=your_token_here` and `DEMO_MODE=false`.
3. If hosting publicly, create a Mini App in @BotFather pointing to your HTTPS domain.
4. Restart the server. Send any video or direct video link to your bot in Telegram. The bot will reply with action buttons to crop into a video note, compress, or rip audio.

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md): Server design, transcoding pipeline, and Telegram bot lifecycle.
- [Telegram Video Note Specifications](docs/TELEGRAM_SPECS.md): Detailed technical constraints for `sendVideoNote`.
- [Development Guide](docs/DEVELOPMENT.md): Local debugging, unit testing, and custom transcoding options.

## License

MIT License. See [LICENSE](LICENSE) for details.
