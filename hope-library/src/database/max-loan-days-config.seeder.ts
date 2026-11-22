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
import { type SystemConfigSeedItem } from './system-config.seeder.js';

/**
 * Cấu hình hạn trả sách mặc định (tính bằng ngày, kiểu số nguyên)
 */
export const MAX_LOAN_DAYS_CONFIG: SystemConfigSeedItem = {
  key: 'MAX_LOAN_DAYS',
  value: '14',
  valueType: SystemConfigValueType.NUMBER,
  group: 'LOAN',
  description: 'Hạn trả sách (ngày)',
  isPublic: true,
};

/**
 * Hàm seed bản ghi cấu hình MAX_LOAN_DAYS vào collection system_configs.
 * Idempotent: chỉ thêm mới nếu key chưa tồn tại, không ghi đè giá trị quản trị viên đã chỉnh sửa.
 */
export async function seedMaxLoanDaysConfig(
  connection: Connection,
): Promise<void> {
  const configModel = connection.model<SystemConfig>(
    SystemConfig.name,
  ) as Model<SystemConfig>;

  console.log(
    '--- Bắt đầu khởi tạo cấu hình hạn trả sách (MAX_LOAN_DAYS) ---',
  );

  const existing = await configModel
    .findOne({ key: MAX_LOAN_DAYS_CONFIG.key })
    .exec();

  if (existing) {
    console.log(
      `[SKIP] Cấu hình "${MAX_LOAN_DAYS_CONFIG.key}" đã tồn tại (value: ${existing.value})`,
    );
    return;
  }

  await configModel.create({
    id: randomUUID(),
    key: MAX_LOAN_DAYS_CONFIG.key,
    value: MAX_LOAN_DAYS_CONFIG.value,
    valueType: MAX_LOAN_DAYS_CONFIG.valueType,
    group: MAX_LOAN_DAYS_CONFIG.group,
    description: MAX_LOAN_DAYS_CONFIG.description,
    isPublic: MAX_LOAN_DAYS_CONFIG.isPublic,
  });

  console.log(
    `[OK] Đã tạo cấu hình "${MAX_LOAN_DAYS_CONFIG.key}" = ${MAX_LOAN_DAYS_CONFIG.value} (${MAX_LOAN_DAYS_CONFIG.valueType})`,
  );
  console.log('--- Hoàn tất seeding cấu hình hạn trả sách ---');
}

// Module độc lập để có thể chạy trực tiếp: npx tsx src/database/max-loan-days-config.seeder.ts
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
class StandaloneMaxLoanDaysConfigSeedModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(
    StandaloneMaxLoanDaysConfigSeedModule,
  );

  try {
    const connection = app.get<Connection>(getConnectionToken());
    await seedMaxLoanDaysConfig(connection);
    console.log('Script max-loan-days-config seeder hoàn thành thành công!');
  } catch (error) {
    console.error('Lỗi khi thực thi max-loan-days-config seeder:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

// Nếu file được gọi trực tiếp bằng Node/tsx
if (process.argv[1]?.includes('max-loan-days-config.seeder')) {
  void bootstrap();
}
