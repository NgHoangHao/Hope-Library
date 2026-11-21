import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './model/book/book.entity.js';
import { BookCopy, BookCopySchema } from './model/book-copy/book-copy.entity.js';
import { Author, AuthorSchema } from './model/author/author.entity.js';
import { Loan, LoanSchema } from './model/loan/loan.entity.js';
import { LoanItem, LoanItemSchema } from './model/loan-item/loan-item.entity.js';
import { User, UserSchema } from './model/user/user.entity.js';
import { DashboardRepository } from './repository/dashboard.repository.js';
import { DashboardService } from './service/dashboard.service.js';
import { DashboardController } from './controller/dashboard.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: BookCopy.name, schema: BookCopySchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Loan.name, schema: LoanSchema },
      { name: LoanItem.name, schema: LoanItemSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardRepository, DashboardService],
  exports: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
