import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PassThrough } from 'node:stream';
import { v2 as cloudinary } from 'cloudinary';
import { FileStorageService } from './file-storage.service.js';
import { AppException } from '../common/index.js';

describe('FileStorageService (Cloudinary)', () => {
  let service: FileStorageService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
    process.env.CLOUDINARY_API_KEY = 'demo-key';
    process.env.CLOUDINARY_API_SECRET = 'demo-secret';
    process.env.CLOUDINARY_FOLDER = 'hope-library';
    delete process.env.CLOUDINARY_URL;

    vi.spyOn(cloudinary, 'config').mockReturnValue({} as any);
    service = new FileStorageService();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('nên ném AppException nếu không có file ảnh', () => {
    expect(() => service.validateImageFile(undefined)).toThrow(AppException);
  });

  it('nên ném AppException nếu định dạng file không hợp lệ', () => {
    const invalidFile = {
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('dummy-data'),
    } as Express.Multer.File;

    expect(() => service.validateImageFile(invalidFile)).toThrow(AppException);
  });

  it('nên cho phép file PNG, JPG hoặc WEBP hợp lệ', () => {
    const validPng = {
      originalname: 'cover.png',
      mimetype: 'image/png',
      buffer: Buffer.from('dummy-png-data'),
    } as Express.Multer.File;

    const validJpg = {
      originalname: 'cover.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('dummy-jpg-data'),
    } as Express.Multer.File;

    const validWebp = {
      originalname: 'cover.webp',
      mimetype: 'image/webp',
      buffer: Buffer.from('dummy-webp-data'),
    } as Express.Multer.File;

    expect(() => service.validateImageFile(validPng)).not.toThrow();
    expect(() => service.validateImageFile(validJpg)).not.toThrow();
    expect(() => service.validateImageFile(validWebp)).not.toThrow();
  });

  it('nên trích xuất chính xác public_id từ Cloudinary URL hoặc public_id trực tiếp', () => {
    expect(
      service.extractPublicId(
        'https://res.cloudinary.com/demo-cloud/image/upload/v1700000000/hope-library/books/123-abc.png',
      ),
    ).toBe('hope-library/books/123-abc');

    expect(
      service.extractPublicId(
        'https://res.cloudinary.com/demo-cloud/image/upload/hope-library/avatars/user-1.webp',
      ),
    ).toBe('hope-library/avatars/user-1');

    expect(service.extractPublicId('hope-library/books/123-abc')).toBe(
      'hope-library/books/123-abc',
    );

    // Bỏ qua đường dẫn local cũ và URL ngoài
    expect(service.extractPublicId('/uploads/books/old-cover.png')).toBeNull();
    expect(service.extractPublicId('https://example.com/image.png')).toBeNull();
  });

  it('nên upload file ảnh lên Cloudinary và trả về secure_url + public_id', async () => {
    const dummyFile = {
      originalname: 'clean-architecture.png',
      mimetype: 'image/png',
      buffer: Buffer.from('test-image-content'),
    } as Express.Multer.File;

    const uploadStreamSpy = vi
      .spyOn(cloudinary.uploader, 'upload_stream')
      .mockImplementation((options: any, callback: any) => {
        const stream = new PassThrough();
        stream.on('finish', () => {
          callback(null, {
            public_id: `${options.folder}/${options.public_id}`,
            secure_url: `https://res.cloudinary.com/demo-cloud/image/upload/v1/${options.folder}/${options.public_id}.png`,
          });
        });
        return stream as any;
      });

    const result = await service.saveImage(dummyFile, 'books');

    expect(uploadStreamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'hope-library/books',
        resource_type: 'image',
      }),
      expect.any(Function),
    );
    expect(result.fileName).toContain('.png');
    expect(result.filePath).toContain('hope-library/books/');
    expect(result.fileUrl).toMatch(/^https:\/\/res\.cloudinary\.com\/demo-cloud\//);
  });

  it('nên xóa file ảnh trên Cloudinary theo URL hoặc public_id', async () => {
    const destroySpy = vi
      .spyOn(cloudinary.uploader, 'destroy')
      .mockResolvedValue({ result: 'ok' } as any);

    const deletedByUrl = await service.deleteFile(
      'https://res.cloudinary.com/demo-cloud/image/upload/v1700/hope-library/books/test-id.png',
    );
    expect(deletedByUrl).toBe(true);
    expect(destroySpy).toHaveBeenCalledWith('hope-library/books/test-id', {
      resource_type: 'image',
    });

    // Đường dẫn local cũ -> trả về false, không gọi Cloudinary
    destroySpy.mockClear();
    const deletedLegacy = await service.deleteFile('/uploads/books/legacy.png');
    expect(deletedLegacy).toBe(false);
    expect(destroySpy).not.toHaveBeenCalled();
  });

  it('nên ném AppException nếu thiếu cấu hình Cloudinary khi upload', async () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    delete process.env.CLOUDINARY_URL;

    const unconfiguredService = new FileStorageService();
    const dummyFile = {
      originalname: 'cover.png',
      mimetype: 'image/png',
      buffer: Buffer.from('img'),
    } as Express.Multer.File;

    await expect(unconfiguredService.saveImage(dummyFile, 'books')).rejects.toThrow(
      AppException,
    );
  });

  it('nên phân tích CLOUDINARY_URL và cấu hình cloud_name, api_key, api_secret đúng cách', () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    process.env.CLOUDINARY_URL = 'cloudinary://123456:my_secret@my-real-cloud';

    const configSpy = vi.spyOn(cloudinary, 'config').mockReturnValue({} as any);
    new FileStorageService();

    expect(configSpy).toHaveBeenCalledWith({
      cloud_name: 'my-real-cloud',
      api_key: '123456',
      api_secret: 'my_secret',
      secure: true,
    });
  });
});
