import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { LoanStatus } from './loan.entity.js';
import {
  CreateLoanItemDto,
  LoanItemRequest,
  UpdateLoanItemDto,
  UpdateLoanItemRequest,
  LoanItemResponse,
} from '../loan-item/loan-item.dto.js';
import { UserResponse } from '../user/user.dto.js';
import { FineResponse } from '../fine/fine.dto.js';

export {
  LoanStatus,
  CreateLoanItemDto,
  LoanItemRequest,
  UpdateLoanItemDto,
  UpdateLoanItemRequest,
  LoanItemResponse,
};

export class CreateLoanDto {
  @AutoMap(() => String)
  @ApiProperty({
    description: 'Mã định danh người mượn (User UUID)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
  })
  userId: string;

  @AutoMap(() => Date)
  @ApiPropertyOptional({
    description: 'Ngày mượn sách (mặc định là ngày hiện tại)',
    example: '2026-11-14T07:00:00.000Z',
    type: Date,
  })
  loanDate?: Date;

  @AutoMap(() => Date)
  @ApiProperty({
    description: 'Hạn trả sách (due date)',
    example: '2026-11-28T07:00:00.000Z',
    type: Date,
  })
  dueDate: Date;

  @AutoMap(() => Date)
  @ApiPropertyOptional({
    description: 'Hạn chót đến quầy nhận sách (48h đối với PENDING)',
    example: '2026-11-16T07:00:00.000Z',
    type: Date,
  })
  pickupDeadline?: Date;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    enum: LoanStatus,
    description: 'Trạng thái phiếu mượn',
    default: LoanStatus.BORROWED,
  })
  status?: LoanStatus;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Ghi chú thêm về phiếu mượn',
    example: 'Mượn sách phục vụ nghiên cứu',
  })
  notes?: string;

  @AutoMap(() => [CreateLoanItemDto])
  @ApiProperty({
    description: 'Danh sách các mục mượn sách (LoanItemRequest list)',
    type: () => [CreateLoanItemDto],
  })
  items: CreateLoanItemDto[];
}

export class ReserveBookDto {
  @ApiProperty({
    description: 'Danh sách ID các bản sao sách muốn đặt mượn (UUID)',
    example: ['d9b2d63d-a233-4f27-a048-ef36b69cf93f'],
    type: [String],
  })
  bookCopyIds: string[];

  @ApiPropertyOptional({
    description: 'Ghi chú thêm của độc giả khi đặt mượn',
    example: 'Đặt mượn giữ chỗ online',
  })
  notes?: string;
}

export class FulfillLoanDto {
  @ApiPropertyOptional({
    description: 'Danh sách ID các bản sao sách vật lý giao thực tế (nếu thủ thư đổi bản sao)',
    type: [String],
  })
  bookCopyIds?: string[];

  @ApiPropertyOptional({
    description: 'Danh sách mã vạch (barcode) các bản sao vật lý thủ thư quét thực tế tại quầy',
    type: [String],
  })
  barcodes?: string[];


  @ApiPropertyOptional({
    description: 'Hạn trả sách cụ thể (nếu không dùng số ngày loanDurationDays)',
    type: Date,
    example: '2026-11-30T07:00:00.000Z',
  })
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Ghi chú thêm từ thủ thư khi giao sách',
    example: 'Đã đối chiếu thẻ độc giả và giao sách tại quầy',
  })
  notes?: string;
}

export { CreateLoanDto as LoanRequest, CreateLoanDto as CreateLoanRequest };

export class UpdateLoanDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mã định danh người mượn (User UUID)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
  })
  userId?: string;

  @AutoMap(() => Date)
  @ApiPropertyOptional({
    description: 'Ngày mượn sách',
    example: '2026-11-14T07:00:00.000Z',
    type: Date,
  })
  loanDate?: Date;

  @AutoMap(() => Date)
  @ApiPropertyOptional({
    description: 'Hạn trả sách',
    example: '2026-11-28T07:00:00.000Z',
    type: Date,
  })
  dueDate?: Date;

  @AutoMap(() => Date)
  @ApiPropertyOptional({
    description: 'Ngày trả thực tế của phiếu mượn',
    example: '2026-11-20T07:00:00.000Z',
    type: Date,
  })
  returnDate?: Date | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Ghi chú thêm về phiếu mượn',
  })
  notes?: string | null;

  @AutoMap(() => [UpdateLoanItemDto])
  @ApiPropertyOptional({
    description: 'Danh sách cập nhật các LoanItem của Loan (khi tất cả LoanItem có status là RETURNED, trạng thái Loan sẽ tự động chuyển sang RETURNED)',
    type: () => [UpdateLoanItemDto],
  })
  items?: UpdateLoanItemDto[];
}

export { UpdateLoanDto as UpdateLoanRequest };

export class QueryLoanDto {
  @ApiPropertyOptional({
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    default: 1,
    example: 1,
    type: Number,
  })
  page?: number | string;

  @ApiPropertyOptional({
    description: 'Số lượng mục mỗi trang',
    default: 10,
    example: 10,
    type: Number,
  })
  size?: number | string;

  @ApiPropertyOptional({
    description: 'Lọc theo ID người mượn (User UUID)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
    type: String,
  })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái phiếu mượn',
    enum: LoanStatus,
  })
  status?: LoanStatus;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên người mượn, username, email hoặc mã phiếu mượn',
    type: String,
  })
  search?: string;
}

export class LoanResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã ID phiếu mượn (UUID)' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã ID người mượn (User UUID)' })
  userId: string;

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Ngày mượn' })
  loanDate: Date;

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Hạn trả' })
  dueDate: Date;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Ngày trả thực tế' })
  returnDate?: Date | null;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Hạn chót đến quầy nhận sách (48h)' })
  pickupDeadline?: Date | null;

  @AutoMap(() => String)
  @ApiProperty({ enum: LoanStatus, description: 'Trạng thái phiếu mượn' })
  status: LoanStatus;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Ghi chú' })
  notes?: string | null;

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Thời điểm tạo' })
  createdAt: Date;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Thời điểm cập nhật' })
  updatedAt?: Date | null;

  @AutoMap(() => UserResponse)
  @ApiPropertyOptional({
    description: 'Thông tin người mượn',
    type: () => UserResponse,
  })
  user?: UserResponse;

  @AutoMap(() => [FineResponse])
  @ApiPropertyOptional({
    description: 'Danh sách các khoản phạt liên quan',
    type: () => [FineResponse],
  })
  fines?: FineResponse[];

  @ApiPropertyOptional({
    description: 'Tổng số tiền phạt chưa thanh toán của phiếu mượn',
    example: 15000,
  })
  unpaidFineAmount?: number;

  constructor(partial?: Partial<LoanResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class LoanDetailResponse extends LoanResponse {
  @AutoMap(() => [LoanItemResponse])
  @ApiProperty({
    description: 'Danh sách chi tiết các mục mượn sách',
    type: () => [LoanItemResponse],
  })
  items: LoanItemResponse[];

  constructor(partial?: Partial<LoanDetailResponse>) {
    super(partial);
    if (partial) {
      Object.assign(this, partial);
      if (partial.items) {
        this.items = partial.items;
      }
    }
  }
}

export class PaginatedLoanResponse {
  @ApiProperty({ type: () => [LoanResponse], description: 'Danh sách phiếu mượn của trang hiện tại' })
  items: LoanResponse[];

  @ApiProperty({ example: 1, description: 'Số trang hiện tại (bắt đầu từ 1)' })
  page: number;

  @ApiProperty({ example: 10, description: 'Số lượng mục mỗi trang' })
  size: number;

  @ApiProperty({ example: 50, description: 'Tổng số phiếu mượn thỏa mãn' })
  total: number;

  @ApiProperty({ example: 50, description: 'Tổng số phiếu mượn thỏa mãn' })
  totalItems: number;

  @ApiProperty({ example: 5, description: 'Tổng số trang' })
  totalPages: number;

  @ApiPropertyOptional({
    example: 25000,
    description: 'Tổng số tiền phạt chưa thanh toán của người dùng (khi truy vấn theo userId)',
  })
  totalUnpaidFineAmount?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Số phiếu mượn có khoản tiền phạt chưa thanh toán của người dùng',
  })
  unpaidFineLoansCount?: number;

  constructor(partial?: Partial<PaginatedLoanResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
