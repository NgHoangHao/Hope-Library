import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { entities } from '../model/index.js';
import {
  SystemConfig,
  SystemConfigValueType,
} from '../model/system-config/system-config.entity.js';
import { type SystemConfigSeedItem } from './system-config.seeder.js';

/**
 * Cấu hình thời gian gửi email nhắc nhở trước khi phiếu mượn quá hạn (tính bằng ngày)
 */
export const OVERDUE_REMINDER_CONFIG: SystemConfigSeedItem = {
  key: 'OVERDUE_REMINDER_BEFORE_DAYS',
  value: '1',
  valueType: SystemConfigValueType.NUMBER,
  group: 'LOAN',
  description:
    'Thời gian gửi email nhắc nhở trước khi phiếu mượn quá hạn (ngày)',
  isPublic: false,
};

/**
 * Hàm seed bản ghi cấu hình OVERDUE_REMINDER_BEFORE_DAYS vào bảng system_configs.
 * Idempotent: chỉ thêm mới nếu key chưa tồn tại, không ghi đè giá trị quản trị viên đã chỉnh sửa.
 */
export async function seedOverdueReminderConfig(
  dataSource: DataSource,
): Promise<void> {
  const configRepo = dataSource.getRepository(SystemConfig);

  console.log(
    '--- Bắt đầu khởi tạo cấu hình nhắc nhở quá hạn (OVERDUE_REMINDER_BEFORE_DAYS) ---',
  );

  const existing = await configRepo.findOneBy({
    key: OVERDUE_REMINDER_CONFIG.key,
  });

  if (existing) {
    console.log(
      `[SKIP] Cấu hình "${OVERDUE_REMINDER_CONFIG.key}" đã tồn tại (value: ${existing.value})`,
    );
    return;
  }

  const entity = configRepo.create({
    key: OVERDUE_REMINDER_CONFIG.key,
    value: OVERDUE_REMINDER_CONFIG.value,
    valueType: OVERDUE_REMINDER_CONFIG.valueType,
    group: OVERDUE_REMINDER_CONFIG.group,
    description: OVERDUE_REMINDER_CONFIG.description,
    isPublic: OVERDUE_REMINDER_CONFIG.isPublic,
  });

  await configRepo.save(entity);
  console.log(
    `[OK] Đã tạo cấu hình "${OVERDUE_REMINDER_CONFIG.key}" = ${OVERDUE_REMINDER_CONFIG.value} (${OVERDUE_REMINDER_CONFIG.valueType})`,
  );
  console.log('--- Hoàn tất seeding cấu hình nhắc nhở quá hạn ---');
}

// Module độc lập để có thể chạy trực tiếp: npx tsx src/database/overdue-reminder-config.seeder.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql' as const,
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT', '1433')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities,
        autoLoadEntities: true,
        synchronize: false,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
  ],
})
class StandaloneOverdueReminderConfigSeedModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(
    StandaloneOverdueReminderConfigSeedModule,
  );

  try {
    const dataSource = app.get(DataSource);
    await seedOverdueReminderConfig(dataSource);
    console.log(
      'Script overdue-reminder-config seeder hoàn thành thành công!',
    );
  } catch (error) {
    console.error('Lỗi khi thực thi overdue-reminder-config seeder:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

// Nếu file được gọi trực tiếp bằng Node/tsx
if (process.argv[1]?.includes('overdue-reminder-config.seeder')) {
  void bootstrap();
}
