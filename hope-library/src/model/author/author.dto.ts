import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { BookDetailResponse } from '../book/book.dto.js';

export class CreateAuthorDto {
  @AutoMap(() => String)
  @ApiProperty({
    description: 'Tên tác giả',
    example: 'Robert C. Martin',
  })
  name: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Tiểu sử tác giả',
    example: 'Robert Cecil Martin, colloquially known as Uncle Bob, is an American software engineer and author.',
  })
  biography?: string;
}

export class UpdateAuthorDto {
  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Tên tác giả',
    example: 'Robert C. Martin',
  })
  name?: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({
    description: 'Tiểu sử tác giả',
    example: 'Robert Cecil Martin, colloquially known as Uncle Bob, is an American software engineer and author.',
  })
  biography?: string;
}

export class AuthorResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'ID tác giả' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tên tác giả' })
  name: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Tiểu sử tác giả' })
  biography?: string | null;

  constructor(partial?: Partial<AuthorResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

export class AuthorDetailResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'ID tác giả' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Tên tác giả' })
  name: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Tiểu sử tác giả' })
  biography?: string | null;

  @AutoMap(() => [BookDetailResponse])
  @ApiProperty({
    description: 'Danh sách những cuốn sách do tác giả sáng tác',
    type: () => [BookDetailResponse],
  })
  books: BookDetailResponse[];

  constructor(partial?: Partial<AuthorDetailResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
