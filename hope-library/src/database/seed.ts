import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { entities } from '../model/index.js';
import { seedNavigation } from './navigation.seeder.js';
import { seedPermission } from './permission.seeder.js';
import { seedSystemConfig } from './system-config.seeder.js';

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
class SeedDatabaseModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedDatabaseModule);

  try {
    const dataSource = app.get(DataSource);

    await seedNavigation(dataSource);
    await seedPermission(dataSource);
    await seedSystemConfig(dataSource);

    console.log('Seeder executed successfully!');
  } catch (error) {
    console.error('Seeder failed:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();