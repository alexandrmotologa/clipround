# ClipRound

ClipRound converts standard video files into official circular Telegram video notes, compresses oversized media for mobile chat sharing, and extracts audio tracks. It runs as both a Telegram Mini App connected to a long-polling bot and as a standalone web studio for local editing in any desktop or mobile browser.

## Features

- Converts rectangular videos into 1:1 square MP4 files formatted specifically for Telegram circular video notes (`sendVideoNote`).
- Interactive circular viewfinder with drag-to-pan and zoom controls to frame subjects accurately.
- Dual-handle timeline trimmer enforcing Telegram's 60-second limit with frame-stepping controls.
- Audio volume adjustment (mute up to 2.5x gain) and audio track ripper (MP3 / AAC).
- Video compressor with presets for Telegram size limits (10 MB, 25 MB, 50 MB) and custom CRF controls.
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
4. Restart the server. Send any video to your bot in Telegram. The bot will reply with action buttons to crop into a video note, compress, or rip audio.

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md): Server design, transcoding pipeline, and Telegram bot lifecycle.
- [Telegram Video Note Specifications](docs/TELEGRAM_SPECS.md): Detailed technical constraints for `sendVideoNote`.
- [Development Guide](docs/DEVELOPMENT.md): Local debugging, unit testing, and custom transcoding options.

## License

MIT License. See [LICENSE](LICENSE) for details.
