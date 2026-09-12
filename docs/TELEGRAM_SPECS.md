# Telegram Video Note Technical Specifications

Telegram circular video notes (`video_note` in the Telegram Bot API) require exact container, codec, and dimension constraints. Sending a video that violates these criteria causes the Telegram API to either reject the upload with an error (`400 Bad Request: wrong video note format`) or fallback to displaying it as a standard rectangular video message.

## Strict Format Requirements

| Parameter | Telegram Requirement | ClipRound Configuration |
|---|---|---|
| Container | MP4 | MP4 |
| Video Codec | H.264 (AVC) Baseline/Main Profile | `libx264 -profile:v baseline -level 3.1` |
| Audio Codec | AAC | `aac -b:a 128k -ar 44100` |
| Aspect Ratio | 1:1 (Exact square) | `setsar=1:1` |
| Dimensions | Square up to 640x640 (standard: 384x384 or 480x480) | `480x480` |
| Max Duration | 60 seconds | Enforced in trimmer and FFmpeg duration limit |
| Pixel Format | `yuv420p` | `-pix_fmt yuv420p` |
| Container Flags | Faststart enabled | `-movflags +faststart` |
| Max File Size | Typically under 20 MB | Default output is 2 MB to 8 MB |

## Why Specific Flags Matter

### 1. 1:1 Aspect Ratio and SAR
Telegram clients calculate the circular mask based on the video being an exact square. If the pixel aspect ratio (SAR) or display aspect ratio (DAR) is not 1:1, clients render black letterbox bars inside the circle. ClipRound forces `crop` to equal width and height, scales to 480x480, and applies `setsar=1:1`.

### 2. Faststart (`-movflags +faststart`)
By default, FFmpeg places the `moov` atom (metadata containing index headers and track durations) at the end of the MP4 file. With `+faststart`, FFmpeg relocates the `moov` atom to the front of the file. This allows Telegram's video player to start playback and compute duration immediately without waiting to download the entire file.

### 3. H.264 Baseline Profile and `yuv420p`
Mobile devices (especially older Android and iOS chipsets) struggle with high-tier H.264 profiles in inline video players. Baseline or main profiles with 4:2:0 chroma subsampling guarantee smooth hardware-accelerated playback on all mobile hardware.

### 4. 60-Second Cap
Telegram's API returns a validation error if the video note exceeds 60 seconds. The ClipRound web interface caps the trimmer duration slider at 60 seconds, and the FFmpeg pipeline hard-limits output duration using `-t 60`.
