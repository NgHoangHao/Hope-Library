import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './model/book/book.entity.js';
import { BookCopy } from './model/book-copy/book-copy.entity.js';
import { Loan } from './model/loan/loan.entity.js';
import { LoanItem } from './model/loan-item/loan-item.entity.js';
import { User } from './model/user/user.entity.js';
import { DashboardRepository } from './repository/dashboard.repository.js';
import { DashboardService } from './service/dashboard.service.js';
import { DashboardController } from './controller/dashboard.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Book, BookCopy, Loan, LoanItem, User])],
  controllers: [DashboardController],
  providers: [DashboardRepository, DashboardService],
  exports: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
