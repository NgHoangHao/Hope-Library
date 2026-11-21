import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { UserResponse } from '../user/user.dto.js';

export enum AuditLogAction {
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export class CreateAuditLogDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mã định danh người dùng thực hiện (User UUID)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
  })
  userId?: string | null;

  @AutoMap(() => String)
  @ApiProperty({
    description: 'Hành động CRUD (GET, POST, PUT, DELETE hoặc tên tác vụ)',
    example: 'POST',
  })
  action: string;

  @AutoMap(() => String)
  @ApiProperty({
    description: 'Tài nguyên hoặc endpoint mục tiêu',
    example: '/api/loans',
  })
  targetResource: string;

  @ApiPropertyOptional({
    description: 'Chi tiết dữ liệu yêu cầu hoặc kết quả thực hiện',
    example: { body: { title: 'Clean Code' }, statusCode: 201 },
  })
  details?: Record<string, unknown> | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Địa chỉ IP của client',
    example: '127.0.0.1',
  })
  ipAddress?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'User Agent của trình duyệt/client',
  })
  userAgent?: string | null;
}

export class QueryAuditLogDto {
  @ApiPropertyOptional({
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    default: 1,
    example: 1,
    type: Number,
  })
  page?: number | string;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi mỗi trang',
    default: 10,
    example: 10,
    type: Number,
  })
  size?: number | string;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên người dùng (fullName, username, email)',
    example: 'Nguyen Van A',
    type: String,
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo loại hành động (GET, POST, PUT, DELETE)',
    enum: AuditLogAction,
    example: 'POST',
  })
  action?: string;
}

export class AuditLogResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã định danh nhật ký kiểm toán (UUID)' })
  id: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mã người dùng (User UUID)' })
  userId?: string | null;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Hành động (GET, POST, PUT, DELETE)' })
  action: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tài nguyên mục tiêu' })
  targetResource: string;

  @ApiPropertyOptional({ description: 'Thông tin chi tiết' })
  details?: Record<string, unknown> | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Địa chỉ IP' })
  ipAddress?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'User Agent' })
  userAgent?: string | null;

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Thời điểm tạo log' })
  createdAt: Date;

  @AutoMap(() => UserResponse)
  @ApiPropertyOptional({
    description: 'Thông tin người dùng thực hiện',
    type: () => UserResponse,
  })
  user?: UserResponse | null;

  constructor(partial?: Partial<AuditLogResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class PaginatedAuditLogResponse {
  @ApiProperty({
    type: () => [AuditLogResponse],
    description: 'Danh sách nhật ký của trang hiện tại',
  })
  items: AuditLogResponse[];

  @ApiProperty({ example: 1, description: 'Số trang hiện tại (bắt đầu từ 1)' })
  page: number;

  @ApiProperty({ example: 10, description: 'Số lượng bản ghi mỗi trang' })
  size: number;

  @ApiProperty({ example: 50, description: 'Tổng số bản ghi thỏa mãn điều kiện' })
  total: number;

  @ApiProperty({ example: 50, description: 'Tổng số bản ghi thỏa mãn điều kiện' })
  totalItems: number;

  @ApiProperty({ example: 5, description: 'Tổng số trang' })
  totalPages: number;

  constructor(partial?: Partial<PaginatedAuditLogResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

