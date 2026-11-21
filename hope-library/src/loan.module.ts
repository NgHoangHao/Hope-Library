import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from './model/loan/loan.entity.js';
import { LoanItem } from './model/loan-item/loan-item.entity.js';
import { Fine } from './model/fine/fine.entity.js';
import { BookCopy } from './model/book-copy/book-copy.entity.js';
import { Book } from './model/book/book.entity.js';
import { User } from './model/user/user.entity.js';
import { LoanRepository } from './repository/loan.repository.js';
import { LoanService } from './service/loan.service.js';
import { LoanController } from './controller/loan.controller.js';
import { LoanMapper } from './mapper/loan.mapper.js';
import { RedisService } from './utils/redis.service.js';
import { MailService } from './utils/mail.service.js';
import { LoanSchedulerService } from './service/loan-scheduler.service.js';
import { SystemConfigModule } from './system-config.module.js';

@Module({
  imports: [
    SystemConfigModule,
    TypeOrmModule.forFeature([Loan, LoanItem, Fine, BookCopy, Book, User]),
  ],
  controllers: [LoanController],
  providers: [
    LoanRepository,
    LoanService,
    LoanMapper,
    RedisService,
    MailService,
    LoanSchedulerService,
  ],
  exports: [LoanService, LoanRepository, LoanMapper, RedisService],
})
export class LoanModule {}

