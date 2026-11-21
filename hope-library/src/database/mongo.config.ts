import type { ConfigService } from '@nestjs/config';
import type { MongooseModuleFactoryOptions } from '@nestjs/mongoose';

/**
 * Tạo cấu hình kết nối Mongoose dùng MONGODB_URI từ biến môi trường (.env).
 * Nếu URI chưa kèm tên database (ví dụ kết thúc bằng ".mongodb.net/"),
 * tự động dùng MONGODB_DB_NAME -> DB_DATABASE -> mặc định "LibraryDB".
 */
export function getMongoConnectionOptions(
  config: ConfigService,
): MongooseModuleFactoryOptions {
  const uri = config.get<string>('MONGODB_URI')?.trim();
  if (!uri) {
    throw new Error('Thiếu biến môi trường MONGODB_URI trong file .env');
  }

  const explicitDbName = config.get<string>('MONGODB_DB_NAME')?.trim();
  const fallbackDbName = config.get<string>('DB_DATABASE')?.trim() || 'LibraryDB';

  // Kiểm tra xem URI đã có sẵn database path hay chưa (ví dụ mongodb+srv://host/myDb)
  const hasDbInUri = /^mongodb(?:\+srv)?:\/\/[^/]+\/[^/?]+/i.test(uri);

  return {
    uri,
    ...(explicitDbName
      ? { dbName: explicitDbName }
      : !hasDbInUri
        ? { dbName: fallbackDbName }
        : {}),
  };
}
