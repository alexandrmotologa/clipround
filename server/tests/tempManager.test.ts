import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, afterAll } from 'vitest';
import { TempStorageManager } from '../src/storage/tempManager.js';

const TEST_STORAGE = path.resolve(__dirname, 'test_storage');

afterAll(() => {
  try {
    if (fs.existsSync(TEST_STORAGE)) {
      fs.rmSync(TEST_STORAGE, { recursive: true, force: true });
    }
  } catch {
    // ignore
  }
});

describe('TempStorageManager', () => {
  it('creates and registers temporary media files', () => {
    const manager = new TempStorageManager(TEST_STORAGE, 60);
    const { id, filePath } = manager.createFilePath('mp4');

    fs.writeFileSync(filePath, 'fake video data');
    const record = manager.registerFile(id, filePath, 'test.mp4');

    expect(record.id).toBe(id);
    expect(record.fileName).toBe('test.mp4');
    expect(record.fileSize).toBe(15);

    const fetched = manager.getFile(id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(id);

    manager.stop();
  });

  it('removes files on demand', () => {
    const manager = new TempStorageManager(TEST_STORAGE, 60);
    const { id, filePath } = manager.createFilePath('mp4');
    fs.writeFileSync(filePath, 'sample data');
    manager.registerFile(id, filePath, 'remove_me.mp4');

    expect(fs.existsSync(filePath)).toBe(true);
    const removed = manager.removeFile(id);
    expect(removed).toBe(true);
    expect(fs.existsSync(filePath)).toBe(false);

    manager.stop();
  });
});
