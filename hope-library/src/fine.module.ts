import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Fine, FineSchema } from './model/fine/fine.entity.js';
import { FineRepository } from './repository/fine.repository.js';
import { FineService } from './service/fine.service.js';
import { FineController } from './controller/fine.controller.js';
import { FineMapper } from './mapper/fine.mapper.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Fine.name, schema: FineSchema }]),
  ],
  controllers: [FineController],
  providers: [FineRepository, FineService, FineMapper],
  exports: [FineService, FineRepository, FineMapper],
})
export class FineModule {}
