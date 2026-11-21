import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import { FileStorageService } from './file-storage.service.js';
import { AppException } from '../common/index.js';

describe('FileStorageService', () => {
  let service: FileStorageService;
  const createdFiles: string[] = [];

  beforeEach(() => {
    service = new FileStorageService();
  });

  afterEach(async () => {
    for (const filePath of createdFiles) {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath).catch(() => {});
      }
    }
  });

  it('nên ném AppException nếu không có file ảnh', () => {
    expect(() => service.validateImageFile(undefined)).toThrow(AppException);
  });

  it('nên ném AppException nếu định dạng file không phải png hoặc jpg/jpeg', () => {
    const invalidFile = {
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('dummy-data'),
    } as Express.Multer.File;

    expect(() => service.validateImageFile(invalidFile)).toThrow(AppException);
  });

  it('nên cho phép file PNG hoặc JPG hợp lệ', () => {
    const validPng = {
      originalname: 'cover.png',
      mimetype: 'image/png',
      buffer: Buffer.from('dummy-png-data'),
    } as Express.Multer.File;

    expect(() => service.validateImageFile(validPng)).not.toThrow();

    const validJpg = {
      originalname: 'cover.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('dummy-jpg-data'),
    } as Express.Multer.File;

    expect(() => service.validateImageFile(validJpg)).not.toThrow();
  });

  it('nên lưu file ảnh vào ổ đĩa và trả về URL chính xác', async () => {
    const dummyFile = {
      originalname: 'clean-architecture.png',
      mimetype: 'image/png',
      buffer: Buffer.from('test-image-content'),
    } as Express.Multer.File;

    const result = await service.saveImage(dummyFile, 'books');
    createdFiles.push(result.filePath);

    expect(result.fileName).toContain('.png');
    expect(result.fileUrl).toContain('/uploads/books/');
    expect(fs.existsSync(result.filePath)).toBe(true);

    // Kiểm tra xóa file
    const isDeleted = await service.deleteFile(result.fileUrl);
    expect(isDeleted).toBe(true);
    expect(fs.existsSync(result.filePath)).toBe(false);
  });
});
