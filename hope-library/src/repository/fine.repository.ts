import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fine } from '../model/fine/fine.entity.js';

@Injectable()
export class FineRepository {
  constructor(
    @InjectRepository(Fine)
    private readonly fineRepo: Repository<Fine>,
  ) {}

  async findById(id: string): Promise<Fine | null> {
    return this.fineRepo.findOne({ where: { id } });
  }

  async save(fine: Fine): Promise<Fine> {
    return this.fineRepo.save(fine);
  }
}
