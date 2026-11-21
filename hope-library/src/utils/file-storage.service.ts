import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { AppException } from '../common/index.js';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

export interface SaveImageResult {
  fileName: string;
  filePath: string;
  fileUrl: string;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private isConfigured = false;
  private readonly rootFolder: string;

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.rootFolder = (
      this.getEnv('CLOUDINARY_FOLDER') || 'hope-library'
    ).replace(/^\/+|\/+$/g, '');
    this.configureCloudinary();
  }

  private getEnv(key: string): string | undefined {
    const val = this.configService?.get<string>(key) ?? process.env[key];
    return typeof val === 'string' ? val.trim() : undefined;
  }

  /**
   * Cấu hình Cloudinary SDK từ biến môi trường:
   * - Hỗ trợ CLOUDINARY_URL (cloudinary://<api_key>:<api_secret>@<cloud_name>)
   * - Hoặc bộ 3 biến CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
   */
  private configureCloudinary(): boolean {
    if (this.isConfigured) {
      return true;
    }

    const cloudinaryUrl = this.getEnv('CLOUDINARY_URL');
    const cloudName = this.getEnv('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.getEnv('CLOUDINARY_API_KEY');
    const apiSecret = this.getEnv('CLOUDINARY_API_SECRET');

    if (cloudinaryUrl) {
      try {
        const parsed = new URL(cloudinaryUrl);
        const parsedCloudName = parsed.hostname;
        const parsedApiKey = decodeURIComponent(parsed.username);
        const parsedApiSecret = decodeURIComponent(parsed.password);

        if (
          parsed.protocol === 'cloudinary:' &&
          parsedCloudName &&
          parsedApiKey &&
          parsedApiSecret
        ) {
          cloudinary.config({
            cloud_name: parsedCloudName,
            api_key: parsedApiKey,
            api_secret: parsedApiSecret,
            secure: true,
          });
          this.isConfigured = true;
          return true;
        }
        this.logger.error(
          'CLOUDINARY_URL không đúng định dạng (yêu cầu: cloudinary://<api_key>:<api_secret>@<cloud_name>)',
        );
      } catch {
        this.logger.error(
          'Không thể phân tích CLOUDINARY_URL (yêu cầu: cloudinary://<api_key>:<api_secret>@<cloud_name>)',
        );
      }
    }

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      return true;
    }

    return false;
  }

  private ensureConfigured(): void {
    if (!this.configureCloudinary()) {
      throw AppException.internal(
        'Chưa cấu hình Cloudinary (thiếu CLOUDINARY_URL hoặc CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)',
        null,
        'CLOUDINARY_CONFIG_MISSING',
      );
    }
  }

  /**
   * Kiểm tra định dạng file ảnh (chỉ cho phép png, jpg/jpeg, webp)
   */
  validateImageFile(file?: Express.Multer.File): void {
    if (!file) {
      throw AppException.badRequest(
        'Không tìm thấy file ảnh tải lên',
        { field: 'image' },
        'IMAGE_REQUIRED',
      );
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeValid = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype.toLowerCase());
    const isExtValid = ALLOWED_IMAGE_EXTENSIONS.includes(ext);

    if (!isMimeValid || !isExtValid) {
      throw AppException.badRequest(
        'Chỉ cho phép tải lên file ảnh định dạng PNG, JPG (JPEG) hoặc WEBP',
        {
          allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
          receivedExtension: ext,
          receivedMimetype: file.mimetype,
        },
        'INVALID_IMAGE_TYPE',
      );
    }
  }

  /**
   * Trích xuất Cloudinary public_id từ URL hoặc public_id trực tiếp.
   * Trả về null nếu là đường dẫn local cũ (/uploads/...) hoặc URL ngoài không phải Cloudinary.
   */
  extractPublicId(fileUrlOrPath?: string | null): string | null {
    if (!fileUrlOrPath || !fileUrlOrPath.trim()) {
      return null;
    }

    const trimmed = fileUrlOrPath.trim();

    // Đường dẫn local cũ (từ trước khi chuyển lên cloud) -> bỏ qua an toàn
    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
      return null;
    }

    // Nếu là URL đầy đủ
    if (/^https?:\/\//i.test(trimmed)) {
      if (!/res\.cloudinary\.com/i.test(trimmed)) {
        return null;
      }

      // Định dạng chuẩn: https://res.cloudinary.com/<cloud>/image/upload/[transforms/][v123456/]<public_id>.<ext>
      const uploadMarker = '/upload/';
      const idx = trimmed.indexOf(uploadMarker);
      if (idx === -1) {
        return null;
      }

      let afterUpload = trimmed.slice(idx + uploadMarker.length).split('?')[0];
      // Bỏ phần version v123456789/ nếu có (và bất kỳ transformation segment nào đứng trước version)
      const versionMatch = afterUpload.match(/(?:^|\/)v\d+\/(.+)$/);
      if (versionMatch) {
        afterUpload = versionMatch[1];
      }

      // Bỏ phần đuôi mở rộng (.png, .jpg, .webp, ...)
      const withoutExt = afterUpload.replace(/\.[^./]+$/, '');
      return withoutExt || null;
    }

    // Trường hợp truyền trực tiếp public_id (ví dụ uploadResult.filePath khi rollback)
    return trimmed.replace(/^\/+/, '').replace(/\.[^./]+$/, '') || null;
  }

  /**
   * Tải file ảnh lên Cloudinary và trả về HTTPS URL + public_id
   * @param file File tải lên từ request (Express.Multer.File)
   * @param subFolder Thư mục con trên Cloudinary (mặc định 'books', ví dụ 'books' | 'avatars')
   */
  async saveImage(
    file: Express.Multer.File,
    subFolder = 'books',
  ): Promise<SaveImageResult> {
    this.validateImageFile(file);
    this.ensureConfigured();

    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = `${Date.now()}-${randomUUID()}`;
    const uniqueFileName = `${baseName}${ext}`;
    const cleanSubFolder = subFolder.replace(/^\/+|\/+$/g, '');
    const folder = cleanSubFolder
      ? `${this.rootFolder}/${cleanSubFolder}`
      : this.rootFolder;

    try {
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: baseName,
            resource_type: 'image',
            overwrite: false,
          },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error('Không nhận được phản hồi từ Cloudinary'));
              return;
            }
            resolve(result);
          },
        );
        uploadStream.end(file.buffer);
      });

      this.logger.log(`Đã tải ảnh lên Cloudinary thành công: ${uploadResult.public_id}`);

      return {
        fileName: uniqueFileName,
        filePath: uploadResult.public_id,
        fileUrl: uploadResult.secure_url,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error(`Lỗi khi tải ảnh lên Cloudinary: ${(error as Error).message}`);
      throw AppException.internal(
        'Không thể tải file ảnh lên hệ thống lưu trữ đám mây',
        { error: (error as Error).message },
        'FILE_WRITE_ERROR',
      );
    }
  }

  /**
   * Xóa file ảnh trên Cloudinary dựa trên URL hoặc public_id
   * @param fileUrlOrPath Cloudinary URL hoặc public_id
   */
  async deleteFile(fileUrlOrPath?: string | null): Promise<boolean> {
    const publicId = this.extractPublicId(fileUrlOrPath);
    if (!publicId) {
      return false;
    }

    if (!this.configureCloudinary()) {
      this.logger.warn(
        `Bỏ qua xóa ảnh (${publicId}) vì chưa cấu hình Cloudinary trong biến môi trường`,
      );
      return false;
    }

    try {
      const response = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });

      if (response?.result === 'ok') {
        this.logger.log(`Đã xóa ảnh trên Cloudinary thành công: ${publicId}`);
        return true;
      }

      if (response?.result === 'not found') {
        return false;
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa file ảnh trên Cloudinary (${publicId}): ${(error as Error).message}`,
      );
      throw AppException.internal(
        'Lỗi khi xóa file ảnh khỏi hệ thống lưu trữ đám mây',
        { publicId, error: (error as Error).message },
        'FILE_DELETE_ERROR',
      );
    }
  }
}
