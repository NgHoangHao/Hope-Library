import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { BookCopyStatus } from './book-copy.entity.js';

export class CreateBookCopyDto {
  @AutoMap(() => String)
  @ApiProperty({
    description: 'Mã barcode duy nhất của cuốn sách',
    example: 'BC-2026-0001',
  })
  barcode: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Vị trí kệ sách lưu trữ',
    example: 'Kệ A, Ngăn 3',
  })
  shelfLocation?: string;
}

export { CreateBookCopyDto as CreateCopyBookDTO, CreateBookCopyDto as CreateCopyBookDto };

export class UpdateBookCopyDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'ID của bản sao sách (nếu là bản sao đã có)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
  })
  id?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mã barcode duy nhất của bản sao sách (bắt buộc khi tạo mới, tùy chọn khi cập nhật bản sao đã có theo id)',
    example: 'BC-2026-0001',
  })
  barcode?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Vị trí kệ sách lưu trữ',
    example: 'Kệ A, Ngăn 3',
  })
  shelfLocation?: string | null;

  @ApiPropertyOptional({
    description: 'Alias cho vị trí kệ sách lưu trữ (shelfLocation)',
    example: 'Kệ A, Ngăn 3',
  })
  location?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    enum: BookCopyStatus,
    description: 'Trạng thái bản sao',
    example: BookCopyStatus.AVAILABLE,
  })
  status?: BookCopyStatus;
}

export { UpdateBookCopyDto as UpdateCopyBookDTO, UpdateBookCopyDto as UpdateCopyBookDto };

export class BookCopyResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã định danh bản sao sách' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã sách gốc' })
  bookId: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã barcode' })
  barcode: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Vị trí kệ sách' })
  shelfLocation?: string | null;

  @AutoMap(() => String)
  @ApiProperty({ enum: BookCopyStatus, description: 'Trạng thái bản sao' })
  status: BookCopyStatus;

  constructor(partial?: Partial<BookCopyResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
