import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { LoanItemStatus } from './loan-item.entity.js';
import { BookCopyResponse } from '../book-copy/book-copy.dto.js';

export class CreateLoanItemDto {
  @AutoMap(() => String)
  @ApiProperty({
    description: 'Mã ID của bản sao sách (BookCopy UUID)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
  })
  bookCopyId: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    enum: LoanItemStatus,
    description: 'Trạng thái mượn sách',
    default: LoanItemStatus.BORROWED,
  })
  status?: LoanItemStatus;
}

export { CreateLoanItemDto as LoanItemRequest, CreateLoanItemDto as CreateLoanItemRequest };

export class UpdateLoanItemDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mã ID của LoanItem (UUID). Nếu có sẽ cập nhật item hiện tại, nếu không có sẽ thêm mới',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  id?: string;

  @AutoMap(() => String)
  @ApiProperty({
    description: 'Mã ID của bản sao sách (BookCopy UUID)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
  })
  bookCopyId: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    enum: LoanItemStatus,
    description: 'Trạng thái mượn sách',
    default: LoanItemStatus.BORROWED,
  })
  status?: LoanItemStatus;

  @AutoMap(() => Date)
  @ApiPropertyOptional({
    description: 'Ngày trả sách',
    type: Date,
  })
  returnedDate?: Date | null;
}

export { UpdateLoanItemDto as UpdateLoanItemRequest };

export class LoanItemResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'ID của mục mượn sách (LoanItem UUID)' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'ID phiếu mượn (Loan UUID)' })
  loanId: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'ID bản sao sách (BookCopy UUID)' })
  bookCopyId: string;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Ngày trả sách thực tế' })
  returnedDate?: Date | null;

  @AutoMap(() => String)
  @ApiProperty({ enum: LoanItemStatus, description: 'Trạng thái của mục mượn' })
  status: LoanItemStatus;

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Thời điểm tạo' })
  createdAt: Date;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Thời điểm cập nhật' })
  updatedAt?: Date | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Tiêu đề của sách' })
  title?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Đường dẫn ảnh bìa / URL của sách' })
  url?: string | null;

  @AutoMap(() => BookCopyResponse)
  @ApiPropertyOptional({ description: 'Thông tin bản sao sách', type: () => BookCopyResponse })
  bookCopy?: BookCopyResponse;

  constructor(partial?: Partial<LoanItemResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

