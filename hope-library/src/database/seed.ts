import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { NestFactory } from '@nestjs/core';
import type { Connection } from 'mongoose';

import { mongooseModels } from '../model/index.js';
import { getMongoConnectionOptions } from './mongo.config.js';
import { seedNavigation } from './navigation.seeder.js';
import { seedPermission } from './permission.seeder.js';
import { seedSystemConfig } from './system-config.seeder.js';

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
class SeedDatabaseModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedDatabaseModule);

  try {
    const connection = app.get<Connection>(getConnectionToken());

    await seedPermission(connection);
    await seedNavigation(connection);
    await seedSystemConfig(connection);

    console.log('Seeder executed successfully!');
  } catch (error) {
    console.error('Seeder failed:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void bootstrap();
