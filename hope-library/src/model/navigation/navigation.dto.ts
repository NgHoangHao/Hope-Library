import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';

export class CreateNavigationDto {
  @AutoMap(() => String)
  @ApiProperty({
    description: 'Mã định danh duy nhất của điều hướng (code)',
    example: 'NAV_BOOK_MANAGEMENT',
  })
  code: string;

  @AutoMap(() => String)
  @ApiProperty({
    description: 'Tên hiển thị của menu / điều hướng',
    example: 'Quản lý sách',
  })
  name: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Đường dẫn liên kết (path / URL)',
    example: '/admin/books',
  })
  path?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mã UUID của điều hướng cha (nếu là menu con)',
    example: 'c28fdcb6-a67b-40aa-a827-0cfc9431bfce',
  })
  parentId?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Icon đại diện (tên icon CSS hoặc class icon)',
    example: 'book-outline',
  })
  icon?: string;

  @AutoMap(() => Number)
  @ApiPropertyOptional({
    description: 'Thứ tự hiển thị (tăng dần)',
    example: 1,
    default: 0,
  })
  sortOrder?: number;

  @AutoMap(() => Boolean)
  @ApiPropertyOptional({
    description: 'Trạng thái hiển thị trên menu',
    example: true,
    default: true,
  })
  isVisible?: boolean;

  @AutoMap(() => Boolean)
  @ApiPropertyOptional({
    description: 'Trạng thái kích hoạt',
    example: true,
    default: true,
  })
  isActive?: boolean;
}

export { CreateNavigationDto as CreateNavigationDTO };

export class UpdateNavigationDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mã định danh duy nhất của điều hướng (code)',
    example: 'NAV_BOOK_MANAGEMENT',
  })
  code?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Tên hiển thị của menu / điều hướng',
    example: 'Quản lý sách & Bản sao',
  })
  name?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Đường dẫn liên kết (path / URL)',
    example: '/admin/books',
  })
  path?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mã UUID của điều hướng cha',
    example: 'c28fdcb6-a67b-40aa-a827-0cfc9431bfce',
  })
  parentId?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Icon đại diện',
    example: 'book-outline',
  })
  icon?: string | null;

  @AutoMap(() => Number)
  @ApiPropertyOptional({
    description: 'Thứ tự hiển thị',
    example: 2,
  })
  sortOrder?: number;

  @AutoMap(() => Boolean)
  @ApiPropertyOptional({
    description: 'Trạng thái hiển thị trên menu',
    example: true,
  })
  isVisible?: boolean;

  @AutoMap(() => Boolean)
  @ApiPropertyOptional({
    description: 'Trạng thái kích hoạt',
    example: true,
  })
  isActive?: boolean;
}

export { UpdateNavigationDto as UpdateNavigationDTO };

export class NavigationResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã định danh UUID của điều hướng' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã duy nhất của điều hướng' })
  code: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tên hiển thị của menu điều hướng' })
  name: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Đường dẫn URL' })
  path?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mã ID của điều hướng cha' })
  parentId?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Icon hiển thị' })
  icon?: string | null;

  @AutoMap(() => Number)
  @ApiProperty({ description: 'Thứ tự hiển thị' })
  sortOrder: number;

  @AutoMap(() => Boolean)
  @ApiProperty({ description: 'Trạng thái hiển thị' })
  isVisible: boolean;

  @AutoMap(() => Boolean)
  @ApiProperty({ description: 'Trạng thái kích hoạt' })
  isActive: boolean;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Thời gian tạo' })
  createdAt?: Date;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Thời gian cập nhật' })
  updatedAt?: Date;

  constructor(partial?: Partial<NavigationResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class NavigationTreeResponse extends NavigationResponse {
  @AutoMap(() => [NavigationTreeResponse])
  @ApiProperty({
    description: 'Danh sách các điều hướng con trực thuộc',
    type: () => [NavigationTreeResponse],
  })
  children: NavigationTreeResponse[];

  constructor(partial?: Partial<NavigationTreeResponse>) {
    super(partial);
    this.children = partial?.children ?? [];
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
