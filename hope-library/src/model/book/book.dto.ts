import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { BookStatus } from './book.entity.js';
import {
  CreateBookCopyDto,
  CreateCopyBookDTO,
  CreateCopyBookDto,
  UpdateBookCopyDto,
  UpdateCopyBookDTO,
  UpdateCopyBookDto,
  BookCopyResponse,
} from '../book-copy/book-copy.dto.js';
import { AuthorResponse } from '../author/author.dto.js';
import { CategoryResponse } from '../category/category.dto.js';

export {
  CreateBookCopyDto,
  CreateCopyBookDTO,
  CreateCopyBookDto,
  UpdateBookCopyDto,
  UpdateCopyBookDTO,
  UpdateCopyBookDto,
  BookCopyResponse,
};

export class CreateBookDto {
  @ApiProperty({
    description: 'Tiêu đề sách',
    example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Mã số tiêu chuẩn quốc tế cho sách (ISBN)',
    example: '978-0132350884',
  })
  isbn?: string;

  @ApiPropertyOptional({
    description: 'ID của tác giả (UUID)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
  })
  authorId?: string;

  @ApiPropertyOptional({
    description: 'ID của thể loại (UUID)',
    example: 'c8f7d93a-8b3e-4b72-b5e2-63234581457f',
  })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Nhà xuất bản',
    example: 'Prentice Hall',
  })
  publisher?: string;

  @ApiPropertyOptional({
    description: 'Năm xuất bản',
    example: 2008,
  })
  publicationYear?: number;

  @ApiPropertyOptional({
    description: 'Phiên bản xuất bản',
    example: '1st Edition',
  })
  edition?: string;

  @ApiPropertyOptional({
    description: 'Mô tả tóm tắt nội dung sách',
    example: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'File ảnh bìa của sách (chỉ cho phép định dạng PNG, JPG, JPEG)',
    type: 'string',
    format: 'binary',
  })
  image?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'File PDF nội dung của sách (chỉ cho phép định dạng PDF, tối đa 10 MB)',
    type: 'string',
    format: 'binary',
  })
  pdf?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Danh sách các bản sao sách (copies) bao gồm barcode và vị trí kệ shelfLocation',
    type: () => [CreateBookCopyDto],
  })
  copies?: CreateBookCopyDto[];
}

export { CreateBookDto as CreateBookDTO };

export class UpdateBookDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Tiêu đề sách',
    example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
  })
  title?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mã số tiêu chuẩn quốc tế cho sách (ISBN)',
    example: '978-0132350884',
  })
  isbn?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'ID của tác giả (UUID)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
  })
  authorId?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'ID của thể loại (UUID)',
    example: 'c8f7d93a-8b3e-4b72-b5e2-63234581457f',
  })
  categoryId?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Nhà xuất bản',
    example: 'Prentice Hall',
  })
  publisher?: string;

  @AutoMap(() => Number)
  @ApiPropertyOptional({
    description: 'Năm xuất bản',
    example: 2008,
  })
  publicationYear?: number;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Phiên bản xuất bản',
    example: '1st Edition',
  })
  edition?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Mô tả tóm tắt nội dung sách',
    example: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
  })
  description?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    enum: BookStatus,
    description: 'Trạng thái sách',
    example: BookStatus.ACTIVE,
  })
  status?: BookStatus;

  @ApiPropertyOptional({
    description: 'File ảnh bìa của sách (chỉ cho phép định dạng PNG, JPG, JPEG, WEBP). Nếu là null hoặc không gửi thì không thay đổi ảnh.',
    type: 'string',
    format: 'binary',
  })
  image?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'File PDF nội dung của sách (chỉ cho phép định dạng PDF, tối đa 10 MB). Nếu là null hoặc không gửi thì không thay đổi file PDF.',
    type: 'string',
    format: 'binary',
  })
  pdf?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Danh sách các bản sao sách (copies) bao gồm barcode, vị trí kệ shelfLocation và status',
    type: () => [UpdateBookCopyDto],
  })
  copies?: UpdateBookCopyDto[];
}

export { UpdateBookDto as UpdateBookDTO };

export class BookResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'ID cuốn sách' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tiêu đề cuốn sách' })
  title: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mã ISBN' })
  isbn?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'ID tác giả' })
  authorId?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'ID thể loại' })
  categoryId?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Nhà xuất bản' })
  publisher?: string | null;

  @AutoMap(() => Number)
  @ApiPropertyOptional({ description: 'Năm xuất bản' })
  publicationYear?: number | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Phiên bản' })
  edition?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mô tả cuốn sách' })
  description?: string | null;

  @AutoMap(() => Number)
  @ApiProperty({ description: 'Tổng số lượng bản sao' })
  totalCopies: number;

  @AutoMap(() => Number)
  @ApiProperty({ description: 'Số lượng bản sao khả dụng' })
  availableCopies: number;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Đường dẫn URL ảnh bìa sách' })
  bookUrl?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Đường dẫn URL file PDF nội dung sách' })
  pdfUrl?: string | null;

  @AutoMap(() => String)
  @ApiProperty({ enum: BookStatus, description: 'Trạng thái sách' })
  status: BookStatus;

  @AutoMap(() => AuthorResponse)
  @ApiPropertyOptional({
    description: 'Thông tin tác giả',
    type: () => AuthorResponse,
  })
  author?: AuthorResponse | null;

  @AutoMap(() => CategoryResponse)
  @ApiPropertyOptional({
    description: 'Thông tin thể loại',
    type: () => CategoryResponse,
  })
  category?: CategoryResponse | null;

  constructor(partial?: Partial<BookResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class BookDetailResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'ID cuốn sách' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tiêu đề cuốn sách' })
  title: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mã ISBN' })
  isbn?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'ID tác giả' })
  authorId?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'ID thể loại' })
  categoryId?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Nhà xuất bản' })
  publisher?: string | null;

  @AutoMap(() => Number)
  @ApiPropertyOptional({ description: 'Năm xuất bản' })
  publicationYear?: number | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Phiên bản' })
  edition?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mô tả cuốn sách' })
  description?: string | null;

  @AutoMap(() => Number)
  @ApiProperty({ description: 'Tổng số lượng bản sao' })
  totalCopies: number;

  @AutoMap(() => Number)
  @ApiProperty({ description: 'Số lượng bản sao khả dụng' })
  availableCopies: number;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Đường dẫn URL ảnh bìa sách' })
  bookUrl?: string | null;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Đường dẫn URL file PDF nội dung sách' })
  pdfUrl?: string | null;

  @AutoMap(() => String)
  @ApiProperty({ enum: BookStatus, description: 'Trạng thái sách' })
  status: BookStatus;

  @AutoMap(() => [BookCopyResponse])
  @ApiPropertyOptional({
    description: 'Danh sách bản sao sách',
    type: () => [BookCopyResponse],
  })
  copies?: BookCopyResponse[];

  @AutoMap(() => AuthorResponse)
  @ApiPropertyOptional({
    description: 'Thông tin tác giả',
    type: () => AuthorResponse,
  })
  author?: AuthorResponse | null;

  @AutoMap(() => CategoryResponse)
  @ApiPropertyOptional({
    description: 'Thông tin thể loại',
    type: () => CategoryResponse,
  })
  category?: CategoryResponse | null;

  constructor(partial?: Partial<BookDetailResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class QueryBookDto {
  @ApiPropertyOptional({
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    default: 1,
    example: 1,
    type: Number,
  })
  page?: number | string;

  @ApiPropertyOptional({
    description: 'Số lượng sách mỗi trang',
    default: 10,
    example: 10,
    type: Number,
  })
  size?: number | string;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên sách (title)',
    example: 'Clean Code',
    type: String,
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo ID thể loại (UUID)',
    example: 'c8f7d93a-8b3e-4b72-b5e2-63234581457f',
    type: String,
  })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo tác giả (ID UUID của tác giả hoặc tên tác giả)',
    example: 'Robert C. Martin',
    type: String,
  })
  author?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo ID tác giả (UUID)',
    example: 'd9b2d63d-a233-4f27-a048-ef36b69cf93f',
    type: String,
  })
  authorId?: string;
}

export class PaginatedBookResponse {
  @ApiProperty({ type: () => [BookResponse], description: 'Danh sách sách của trang hiện tại' })
  items: BookResponse[];

  @ApiProperty({ example: 1, description: 'Số trang hiện tại (bắt đầu từ 1)' })
  page: number;

  @ApiProperty({ example: 10, description: 'Số lượng sách mỗi trang' })
  size: number;

  @ApiProperty({ example: 50, description: 'Tổng số sách thỏa mãn điều kiện' })
  total: number;

  @ApiProperty({ example: 50, description: 'Tổng số sách thỏa mãn điều kiện' })
  totalItems: number;

  @ApiProperty({ example: 5, description: 'Tổng số trang' })
  totalPages: number;

  constructor(partial?: Partial<PaginatedBookResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

