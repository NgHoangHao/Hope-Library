import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, mapWith, type Mapper } from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { Loan } from '../model/loan/loan.entity.js';
import {
  CreateLoanDto,
  LoanDetailResponse,
  LoanResponse,
  PaginatedLoanResponse,
  UpdateLoanDto,
} from '../model/loan/loan.dto.js';
import { LoanItem } from '../model/loan-item/loan-item.entity.js';
import {
  CreateLoanItemDto,
  LoanItemResponse,
  UpdateLoanItemDto,
} from '../model/loan-item/loan-item.dto.js';
import { Fine, FineStatus } from '../model/fine/fine.entity.js';
import { FineResponse } from '../model/fine/fine.dto.js';
import { BookCopy } from '../model/book-copy/book-copy.entity.js';
import { BookCopyResponse } from '../model/book-copy/book-copy.dto.js';
import { User } from '../model/user/user.entity.js';
import { UserResponse } from '../model/user/user.dto.js';

function calculateUnpaidFineAmount(fines?: Fine[] | null): number {
  if (!Array.isArray(fines) || fines.length === 0) {
    return 0;
  }
  return fines.reduce((sum, fine) => {
    const amount = Number(fine.amount ?? 0);
    if (fine.status === FineStatus.UNPAID && Number.isFinite(amount) && amount > 0) {
      return sum + amount;
    }
    return sum;
  }, 0);
}

@Injectable()
export class LoanProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, BookCopy, BookCopyResponse);
      createMap(mapper, User, UserResponse);
      createMap(mapper, Fine, FineResponse);
      createMap(
        mapper,
        LoanItem,
        LoanItemResponse,
        forMember(
          (dest) => dest.title,
          mapFrom((src) => src.bookCopy?.book?.title ?? null),
        ),
        forMember(
          (dest) => dest.url,
          mapFrom((src) => src.bookCopy?.book?.bookUrl ?? null),
        ),
        forMember(
          (dest) => dest.bookCopy,
          mapWith(BookCopyResponse, BookCopy, (src) => src.bookCopy),
        ),
      );
      createMap(mapper, CreateLoanItemDto, LoanItem);
      createMap(mapper, UpdateLoanItemDto, LoanItem);

      createMap(
        mapper,
        Loan,
        LoanResponse,
        forMember(
          (dest) => dest.user,
          mapWith(UserResponse, User, (src) => src.user),
        ),
        forMember(
          (dest) => dest.fines,
          mapWith(FineResponse, Fine, (src) => src.fines ?? []),
        ),
        forMember(
          (dest) => dest.unpaidFineAmount,
          mapFrom((src) => calculateUnpaidFineAmount(src.fines)),
        ),
      );

      createMap(
        mapper,
        Loan,
        LoanDetailResponse,
        forMember(
          (dest) => dest.items,
          mapWith(LoanItemResponse, LoanItem, (src) => src.loanItems ?? []),
        ),
        forMember(
          (dest) => dest.fines,
          mapWith(FineResponse, Fine, (src) => src.fines ?? []),
        ),
        forMember(
          (dest) => dest.unpaidFineAmount,
          mapFrom((src) => calculateUnpaidFineAmount(src.fines)),
        ),
        forMember(
          (dest) => dest.user,
          mapWith(UserResponse, User, (src) => src.user),
        ),
      );

      createMap(mapper, CreateLoanDto, Loan);
      createMap(mapper, UpdateLoanDto, Loan);
    };
  }

  toResponse(loan: Loan): LoanResponse {
    return this.mapper.map(loan, Loan, LoanResponse);
  }

  toResponseList(loans: Loan[]): LoanResponse[] {
    return this.mapper.mapArray(loans, Loan, LoanResponse);
  }

  toDetailResponse(loan: Loan): LoanDetailResponse {
    return this.mapper.map(loan, Loan, LoanDetailResponse);
  }

  toDetailResponseList(loans: Loan[]): LoanDetailResponse[] {
    return this.mapper.mapArray(loans, Loan, LoanDetailResponse);
  }

  toPaginatedResponse(
    loans: Loan[],
    total: number,
    page: number,
    size: number,
    unpaidFineSummary?: {
      totalUnpaidFineAmount: number;
      unpaidFineLoansCount: number;
    },
  ): PaginatedLoanResponse {
    const items = this.toResponseList(loans);
    const totalPages = size > 0 ? Math.ceil(total / size) : 0;
    return new PaginatedLoanResponse({
      items,
      page,
      size,
      total,
      totalItems: total,
      totalPages,
      ...(unpaidFineSummary
        ? {
            totalUnpaidFineAmount: unpaidFineSummary.totalUnpaidFineAmount,
            unpaidFineLoansCount: unpaidFineSummary.unpaidFineLoansCount,
          }
        : {}),
    });
  }

  toItemResponse(item: LoanItem): LoanItemResponse {
    return this.mapper.map(item, LoanItem, LoanItemResponse);
  }

  toItemResponseList(items: LoanItem[]): LoanItemResponse[] {
    return this.mapper.mapArray(items, LoanItem, LoanItemResponse);
  }

  toEntity(dto: CreateLoanDto): Loan {
    return this.mapper.map(dto, CreateLoanDto, Loan);
  }

  toItemEntity(dto: CreateLoanItemDto): LoanItem {
    return this.mapper.map(dto, CreateLoanItemDto, LoanItem);
  }
}

export { LoanProfile as LoanMapper };

