import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthorService } from '../service/author.service.js';
import {
  CreateAuthorDto,
  UpdateAuthorDto,
  AuthorResponse,
  AuthorDetailResponse,
} from '../model/author/author.dto.js';
import { ApiResponse } from '../common/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@ApiTags('Authors')
@ApiBearerAuth()
@Controller('authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  /**
   * GET /authors - Lấy danh sách tất cả tác giả
   */
  @Get()
  @RequirePermissions('AUTHOR_READ')
  @ApiOperation({ summary: 'Lấy danh sách tất cả tác giả' })
  async getAuthors(): Promise<ApiResponse<AuthorResponse[]>> {
    const authors = await this.authorService.getAllAuthors();
    return ApiResponse.success(authors, 'Lấy danh sách tác giả thành công');
  }

  /**
   * GET /authors/:id - Lấy chi tiết tác giả theo ID kèm danh sách sách sáng tác
   */
  @Get(':id')
  @RequirePermissions('AUTHOR_READ')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết tác giả kèm danh sách các cuốn sách sáng tác' })
  async getAuthorById(@Param('id') id: string): Promise<ApiResponse<AuthorDetailResponse>> {
    const author = await this.authorService.getAuthorById(id);
    return ApiResponse.success(author, 'Lấy thông tin chi tiết tác giả thành công');
  }

  /**
   * POST /authors - Thêm mới tác giả (name, biography)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('AUTHOR_CREATE')
  @ApiOperation({ summary: 'Thêm mới tác giả' })
  async createAuthor(@Body() createAuthorDto: CreateAuthorDto): Promise<ApiResponse<AuthorResponse>> {
    const author = await this.authorService.createAuthor(createAuthorDto);
    return ApiResponse.created(author, 'Thêm mới tác giả thành công');
  }

  /**
   * PUT /authors/:id - Cập nhật thông tin tác giả
   */
  @Put(':id')
  @RequirePermissions('AUTHOR_UPDATE')
  @ApiOperation({ summary: 'Cập nhật thông tin tác giả' })
  async updateAuthor(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ): Promise<ApiResponse<AuthorResponse>> {
    const updatedAuthor = await this.authorService.updateAuthor(id, updateAuthorDto);
    return ApiResponse.success(updatedAuthor, 'Cập nhật thông tin tác giả thành công');
  }

  /**
   * DELETE /authors/:id - Xóa tác giả
   */
  @Delete(':id')
  @RequirePermissions('AUTHOR_DELETE')
  @ApiOperation({ summary: 'Xóa tác giả' })
  async deleteAuthor(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.authorService.deleteAuthor(id);
    return ApiResponse.success(null, 'Xóa tác giả thành công');
  }
}
