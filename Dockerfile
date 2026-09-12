# Build stage for web frontend
FROM node:20-alpine AS web-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Build stage for server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Production runtime stage with native FFmpeg
FROM node:20-alpine AS runner
WORKDIR /app

# Install FFmpeg and FFprobe
RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production
ENV PORT=8080

# Copy server dependencies and built assets
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server-builder /app/server/dist ./dist

# Copy static frontend build into server public directory
COPY --from=web-builder /app/web/dist ./public

# Create temp storage directory
RUN mkdir -p /tmp/clipround/storage

EXPOSE 8080

CMD ["node", "dist/index.js"]
