import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { SystemConfigValueType } from './system-config.entity.js';

export class CreateSystemConfigDto {
  @AutoMap(() => String)
  @ApiProperty({
    description: 'Khóa cấu hình duy nhất (ví dụ: OVERDUE_FINE_PER_DAY, MAX_LOAN_DAYS)',
    example: 'OVERDUE_FINE_PER_DAY',
  })
  key: string;

  @AutoMap(() => String)
  @ApiProperty({
    description: 'Giá trị cấu hình lưu dạng chuỗi',
    example: '5000',
  })
  value: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Kiểu dữ liệu của giá trị cấu hình',
    enum: SystemConfigValueType,
    default: SystemConfigValueType.STRING,
    example: SystemConfigValueType.NUMBER,
  })
  valueType?: SystemConfigValueType;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Nhóm cấu hình dùng để phân loại trên giao diện quản trị',
    example: 'LOAN',
  })
  group?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mô tả ý nghĩa của thông số cấu hình',
    example: 'Mức tiền phạt quá hạn mỗi ngày cho một bản sao sách (VNĐ)',
  })
  description?: string | null;

  @AutoMap(() => Boolean)
  @ApiPropertyOptional({
    description: 'Cho phép hiển thị công khai ra giao diện ngoài hay chỉ nội bộ/admin',
    default: false,
    example: false,
  })
  isPublic?: boolean;
}

export { CreateSystemConfigDto as CreateSystemConfigDTO };

export class UpdateSystemConfigDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Khóa cấu hình mới (chỉ áp dụng khi cập nhật theo ID)',
    example: 'OVERDUE_FINE_PER_DAY',
  })
  key?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Giá trị cấu hình mới lưu dạng chuỗi',
    example: '10000',
  })
  value?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Kiểu dữ liệu của giá trị cấu hình',
    enum: SystemConfigValueType,
    example: SystemConfigValueType.NUMBER,
  })
  valueType?: SystemConfigValueType;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Nhóm cấu hình',
    example: 'LOAN',
  })
  group?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mô tả thông số cấu hình',
    example: 'Mức tiền phạt quá hạn mỗi ngày cho một bản sao sách (VNĐ)',
  })
  description?: string | null;

  @AutoMap(() => Boolean)
  @ApiPropertyOptional({
    description: 'Cho phép hiển thị công khai hay không',
    example: false,
  })
  isPublic?: boolean;
}

export { UpdateSystemConfigDto as UpdateSystemConfigDTO };

export class SystemConfigResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'ID cấu hình hệ thống' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Khóa cấu hình' })
  key: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Giá trị cấu hình' })
  value: string;

  @AutoMap(() => String)
  @ApiProperty({
    description: 'Kiểu dữ liệu cấu hình',
    enum: SystemConfigValueType,
  })
  valueType: SystemConfigValueType;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Nhóm cấu hình' })
  group?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mô tả cấu hình' })
  description?: string | null;

  @AutoMap(() => Boolean)
  @ApiProperty({ description: 'Cấu hình công khai hay nội bộ' })
  isPublic: boolean;

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Thời điểm tạo' })
  createdAt: Date;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Thời điểm cập nhật gần nhất' })
  updatedAt?: Date | null;

  constructor(partial?: Partial<SystemConfigResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
