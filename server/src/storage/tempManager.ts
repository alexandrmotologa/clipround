import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

export interface StoredMediaFile {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: number;
}

export class TempStorageManager {
  private storageDir: string;
  private maxAgeMinutes: number;
  private metadata: Map<string, StoredMediaFile> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(storageDir = './storage/temp', maxAgeMinutes = 60) {
    this.storageDir = path.resolve(storageDir);
    this.maxAgeMinutes = maxAgeMinutes;
    this.ensureDirectory();
    this.startCleanupInterval();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public getStorageDirectory(): string {
    return this.storageDir;
  }

  public createFilePath(extension = 'mp4'): { id: string; filePath: string } {
    this.ensureDirectory();
    const id = uuidv4();
    const cleanExt = extension.replace(/^\./, '');
    const fileName = `${id}.${cleanExt}`;
    const filePath = path.join(this.storageDir, fileName);
    return { id, filePath };
  }

  public registerFile(id: string, filePath: string, originalName?: string, mimeType = 'video/mp4'): StoredMediaFile {
    const stats = fs.statSync(filePath);
    const stored: StoredMediaFile = {
      id,
      filePath,
      fileName: originalName || path.basename(filePath),
      fileSize: stats.size,
      mimeType,
      createdAt: Date.now(),
    };
    this.metadata.set(id, stored);
    return stored;
  }

  public getFile(id: string): StoredMediaFile | null {
    const record = this.metadata.get(id);
    if (record && fs.existsSync(record.filePath)) {
      return record;
    }

    // Try finding by ID on disk directly
    const entries = fs.readdirSync(this.storageDir);
    const match = entries.find((file) => file.startsWith(id));
    if (match) {
      const fullPath = path.join(this.storageDir, match);
      const ext = path.extname(match).toLowerCase();
      let mimeType = 'video/mp4';
      if (ext === '.mp3') mimeType = 'audio/mpeg';
      if (ext === '.aac') mimeType = 'audio/aac';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      return this.registerFile(id, fullPath, match, mimeType);
    }

    return null;
  }

  public removeFile(id: string): boolean {
    const record = this.getFile(id);
    if (record) {
      if (fs.existsSync(record.filePath)) {
        try {
          fs.unlinkSync(record.filePath);
        } catch {
          // ignore unlink error
        }
      }
      this.metadata.delete(id);
      return true;
    }
    return false;
  }

  public cleanExpiredFiles(): number {
    const now = Date.now();
    const maxAgeMs = this.maxAgeMinutes * 60 * 1000;
    let removedCount = 0;

    this.ensureDirectory();
    const files = fs.readdirSync(this.storageDir);

    for (const fileName of files) {
      const fullPath = path.join(this.storageDir, fileName);
      try {
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(fullPath);
          removedCount++;
        }
      } catch {
        // File may have been removed concurrently
      }
    }

    for (const [id, record] of this.metadata.entries()) {
      if (now - record.createdAt > maxAgeMs || !fs.existsSync(record.filePath)) {
        this.metadata.delete(id);
      }
    }

    return removedCount;
  }

  private startCleanupInterval(): void {
    // Run cleanup every 15 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanExpiredFiles();
    }, 15 * 60 * 1000);
    // Unref so timer does not block process exit
    this.cleanupTimer.unref();
  }

  public stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export const tempManager = new TempStorageManager(
  process.env.STORAGE_DIR || './storage/temp',
  Number.parseInt(process.env.MAX_FILE_AGE_MINUTES || '60', 10)
);
