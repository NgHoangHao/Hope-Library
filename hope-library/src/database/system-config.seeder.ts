import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { NestFactory } from '@nestjs/core';
import type { Connection, Model } from 'mongoose';

import { mongooseModels } from '../model/index.js';
import { getMongoConnectionOptions } from './mongo.config.js';
import {
  SystemConfig,
  SystemConfigValueType,
} from '../model/system-config/system-config.entity.js';

export interface SystemConfigSeedItem {
  key: string;
  value: string;
  valueType: SystemConfigValueType;
  group: string;
  description: string;
  isPublic: boolean;
}

/**
 * Danh sách 7 cấu hình hệ thống mặc định cho Hope Library
 */
export const DEFAULT_SYSTEM_CONFIGS: SystemConfigSeedItem[] = [
  {
    key: 'OTP_EXPIRATION_MINUTES',
    value: '5',
    valueType: SystemConfigValueType.NUMBER,
    group: 'AUTH',
    description: 'Thời gian hết hạn mã OTP (phút)',
    isPublic: false,
  },
  {
    key: 'PASSWORD_MIN_LENGTH',
    value: '8',
    valueType: SystemConfigValueType.NUMBER,
    group: 'AUTH',
    description: 'Độ dài tối thiểu của mật khẩu (ký tự)',
    isPublic: true,
  },
  {
    key: 'RESERVATION_EXPIRATION_HOURS',
    value: '48',
    valueType: SystemConfigValueType.NUMBER,
    group: 'LOAN',
    description: 'Thời gian hết hạn đặt sách (giờ)',
    isPublic: true,
  },
  {
    key: 'OVERDUE_FINE_PER_DAY',
    value: '20000',
    valueType: SystemConfigValueType.NUMBER,
    group: 'LOAN',
    description: 'Số tiền phạt khi phiếu mượn quá hạn 1 ngày (VNĐ)',
    isPublic: true,
  },
  {
    key: 'MAX_BORROW_BOOKS',
    value: '3',
    valueType: SystemConfigValueType.NUMBER,
    group: 'LOAN',
    description: 'Số sách được mượn tối đa cùng lúc (cuốn)',
    isPublic: true,
  },
  {
    key: 'OVERDUE_REMINDER_BEFORE_DAYS',
    value: '1',
    valueType: SystemConfigValueType.NUMBER,
    group: 'LOAN',
    description:
      'Thời gian gửi email nhắc nhở trước khi phiếu mượn quá hạn (ngày)',
    isPublic: false,
  },
  {
    key: 'MAX_LOAN_DAYS',
    value: '14',
    valueType: SystemConfigValueType.NUMBER,
    group: 'LOAN',
    description: 'Hạn trả sách (ngày)',
    isPublic: true,
  },
];

/**
 * Hàm seed các bản ghi cấu hình hệ thống (SystemConfig).
 * Idempotent: chỉ thêm mới nếu key chưa tồn tại, không ghi đè giá trị quản trị viên đã chỉnh sửa.
 */
export async function seedSystemConfig(connection: Connection): Promise<void> {
  const configModel = connection.model<SystemConfig>(SystemConfig.name) as Model<SystemConfig>;

  console.log('--- Bắt đầu khởi tạo cấu hình hệ thống (System Configs) ---');

  let createdCount = 0;
  let skippedCount = 0;

  for (const item of DEFAULT_SYSTEM_CONFIGS) {
    const existing = await configModel.findOne({ key: item.key }).exec();

    if (existing) {
      skippedCount++;
      console.log(
        `[SKIP] Cấu hình "${item.key}" đã tồn tại (value: ${existing.value})`,
      );
      continue;
    }

    await configModel.create({
      id: randomUUID(),
      key: item.key,
      value: item.value,
      valueType: item.valueType,
      group: item.group,
      description: item.description,
      isPublic: item.isPublic,
    });
    createdCount++;
    console.log(
      `[OK] Đã tạo cấu hình "${item.key}" = ${item.value} (${item.valueType})`,
    );
  }

  console.log(
    `--- Hoàn tất seeding System Configs: thêm mới ${createdCount}, bỏ qua ${skippedCount} ---`,
  );
}

// Module độc lập để có thể chạy trực tiếp: npx tsx src/database/system-config.seeder.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => getMongoConnectionOptions(config),
    }),
    MongooseModule.forFeature(mongooseModels),
  ],
})
class StandaloneSystemConfigSeedModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(
    StandaloneSystemConfigSeedModule,
  );

  try {
    const connection = app.get<Connection>(getConnectionToken());
    await seedSystemConfig(connection);
    console.log('Script system-config seeder hoàn thành thành công!');
  } catch (error) {
    console.error('Lỗi khi thực thi system-config seeder:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

// Nếu file được gọi trực tiếp bằng Node/tsx
if (process.argv[1]?.includes('system-config.seeder')) {
  void bootstrap();
}
