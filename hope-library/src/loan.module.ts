import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Loan, LoanSchema } from './model/loan/loan.entity.js';
import { LoanItem, LoanItemSchema } from './model/loan-item/loan-item.entity.js';
import { Fine, FineSchema } from './model/fine/fine.entity.js';
import { BookCopy, BookCopySchema } from './model/book-copy/book-copy.entity.js';
import { Book, BookSchema } from './model/book/book.entity.js';
import { Author, AuthorSchema } from './model/author/author.entity.js';
import { User, UserSchema } from './model/user/user.entity.js';
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
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: LoanItem.name, schema: LoanItemSchema },
      { name: Fine.name, schema: FineSchema },
      { name: BookCopy.name, schema: BookCopySchema },
      { name: Book.name, schema: BookSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: User.name, schema: UserSchema },
    ]),
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
