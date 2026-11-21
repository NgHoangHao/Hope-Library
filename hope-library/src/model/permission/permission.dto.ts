import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã quyền hạn duy nhất', example: 'BOOK_CREATE' })
  code: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mô tả chi tiết quyền hạn', example: 'Quyền tạo mới sách' })
  description?: string;
}

export class UpdatePermissionDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mã quyền hạn duy nhất', example: 'BOOK_CREATE' })
  code?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mô tả chi tiết quyền hạn', example: 'Quyền tạo mới sách' })
  description?: string;
}

export class PermissionResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã định danh Permission (UUID)' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã quyền hạn duy nhất' })
  code: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mô tả chi tiết quyền hạn' })
  description?: string | null;

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Thời điểm tạo quyền hạn' })
  createdAt: Date;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Thời điểm cập nhật quyền hạn' })
  updatedAt?: Date | null;

  constructor(partial?: Partial<PermissionResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
