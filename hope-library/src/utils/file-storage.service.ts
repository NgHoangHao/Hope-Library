import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppException } from '../common/index.js';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg','image/webp'];
export const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg','.webp'];

/**
 * Lấy thư mục upload nằm trên cùng ổ đĩa chứa source code project (mặc định E:\hope-library-uploads)
 */
export function getUploadDirectory(): string {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(process.env.UPLOAD_DIR);
  }
  const rootDrive = path.parse(process.cwd()).root; // "E:\" trên Windows
  return path.join(rootDrive, 'hope-library-uploads');
}

export interface SaveImageResult {
  fileName: string;
  filePath: string;
  fileUrl: string;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadRootDir: string;

  constructor() {
    this.uploadRootDir = getUploadDirectory();
    this.ensureDirectoryExists(this.uploadRootDir);
  }

  /**
   * Đảm bảo thư mục lưu trữ tồn tại
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      this.logger.log(`Đã khởi tạo thư mục lưu trữ file tại: ${dirPath}`);
    }
  }

  /**
   * Kiểm tra định dạng file ảnh (chỉ cho phép png, jpg/jpeg)
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
        'Chỉ cho phép tải lên file ảnh định dạng PNG hoặc JPG (JPEG)',
        {
          allowedExtensions: ['png', 'jpg', 'jpeg'],
          receivedExtension: ext,
          receivedMimetype: file.mimetype,
        },
        'INVALID_IMAGE_TYPE',
      );
    }
  }

  /**
   * Lưu file ảnh vào thư mục trên cùng ổ đĩa chứa project và chuyển đổi thành URL
   * @param file File tải lên từ request (Express.Multer.File)
   * @param subFolder Thư mục con (mặc định 'books')
   */
  async saveImage(
    file: Express.Multer.File,
    subFolder = 'books',
  ): Promise<SaveImageResult> {
    this.validateImageFile(file);

    const targetDir = path.join(this.uploadRootDir, subFolder);
    this.ensureDirectoryExists(targetDir);

    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFileName = `${Date.now()}-${randomUUID()}${ext}`;
    const destinationPath = path.join(targetDir, uniqueFileName);

    try {
      await fs.promises.writeFile(destinationPath, file.buffer);
    } catch (error) {
      this.logger.error(`Lỗi khi ghi file ảnh vào đĩa: ${(error as Error).message}`);
      throw AppException.internal(
        'Không thể lưu file ảnh vào hệ thống lưu trữ',
        { error: (error as Error).message },
        'FILE_WRITE_ERROR',
      );
    }

    // Chuyển đổi thành URL dạng /uploads/books/{fileName}
    const fileUrl = `/uploads/${subFolder}/${uniqueFileName}`;

    return {
      fileName: uniqueFileName,
      filePath: destinationPath,
      fileUrl,
    };
  }

  /**
   * Xóa file ảnh dựa trên URL hoặc đường dẫn tuyệt đối
   * @param fileUrlOrPath URL (ví dụ /uploads/books/xyz.png) hoặc đường dẫn file trên ổ đĩa
   */
  async deleteFile(fileUrlOrPath?: string | null): Promise<boolean> {
    if (!fileUrlOrPath || !fileUrlOrPath.trim()) {
      return false;
    }

    let absolutePath = fileUrlOrPath.trim();

    // Nếu truyền vào fileUrl dạng /uploads/...
    if (absolutePath.startsWith('/uploads/') || absolutePath.startsWith('uploads/')) {
      const relativePart = absolutePath.replace(/^\/?uploads\//, '');
      absolutePath = path.join(this.uploadRootDir, relativePart);
    }

    try {
      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        this.logger.log(`Đã xóa file thành công: ${absolutePath}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error(`Lỗi khi xóa file ảnh (${absolutePath}): ${(error as Error).message}`);
      throw AppException.internal(
        'Lỗi khi xóa file ảnh khỏi ổ đĩa',
        { path: absolutePath, error: (error as Error).message },
        'FILE_DELETE_ERROR',
      );
    }
  }
}
