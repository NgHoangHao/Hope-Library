import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { BookDetailResponse } from '../book/book.dto.js';

export class CreateCategoryDto {
  @AutoMap(() => String)
  @ApiProperty({
    description: 'Tên thể loại sách',
    example: 'Công nghệ thông tin',
  })
  name: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mô tả về thể loại sách',
    example: 'Các tài liệu, giáo trình, sách chuyên khảo về phần mềm, mạng máy tính, AI,...',
  })
  description?: string;
}

export { CreateCategoryDto as CreateCategoryDTO };

export class UpdateCategoryDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Tên thể loại sách',
    example: 'Công nghệ thông tin',
  })
  name?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mô tả về thể loại sách',
    example: 'Các tài liệu, giáo trình, sách chuyên khảo về phần mềm, mạng máy tính, AI,...',
  })
  description?: string;
}

export { UpdateCategoryDto as UpdateCategoryDTO };

export class CategoryResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'ID thể loại' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tên thể loại' })
  name: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mô tả thể loại' })
  description?: string | null;

  constructor(partial?: Partial<CategoryResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class CategoryDetailResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'ID thể loại' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tên thể loại' })
  name: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mô tả thể loại' })
  description?: string | null;

  @AutoMap(() => [BookDetailResponse])
  @ApiProperty({
    description: 'Danh sách các cuốn sách thuộc thể loại này',
    type: () => [BookDetailResponse],
  })
  books: BookDetailResponse[];

  constructor(partial?: Partial<CategoryDetailResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
