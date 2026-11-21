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
import { CategoryService } from '../service/category.service.js';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponse,
  CategoryDetailResponse,
} from '../model/category/category.dto.js';
import { ApiResponse } from '../common/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /categories - Lấy danh sách tất cả thể loại
   */
  @Get()
  @RequirePermissions('CATEGORY_READ')
  @ApiOperation({ summary: 'Lấy danh sách tất cả thể loại' })
  async getCategories(): Promise<ApiResponse<CategoryResponse[]>> {
    const categories = await this.categoryService.getAllCategories();
    return ApiResponse.success(categories, 'Lấy danh sách thể loại thành công');
  }

  /**
   * GET /categories/:id - Lấy chi tiết thể loại theo ID kèm danh sách sách liên kết
   */
  @Get(':id')
  @RequirePermissions('CATEGORY_READ')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết thể loại kèm danh sách các cuốn sách liên kết' })
  async getCategoryById(@Param('id') id: string): Promise<ApiResponse<CategoryDetailResponse>> {
    const category = await this.categoryService.getCategoryById(id);
    return ApiResponse.success(category, 'Lấy thông tin chi tiết thể loại thành công');
  }

  /**
   * POST /categories - Thêm mới thể loại
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('CATEGORY_CREATE')
  @ApiOperation({ summary: 'Thêm mới thể loại' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto): Promise<ApiResponse<CategoryResponse>> {
    const category = await this.categoryService.createCategory(createCategoryDto);
    return ApiResponse.created(category, 'Thêm mới thể loại thành công');
  }

  /**
   * PUT /categories/:id - Cập nhật thông tin thể loại
   */
  @Put(':id')
  @RequirePermissions('CATEGORY_UPDATE')
  @ApiOperation({ summary: 'Cập nhật thông tin thể loại' })
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponse<CategoryResponse>> {
    const updatedCategory = await this.categoryService.updateCategory(id, updateCategoryDto);
    return ApiResponse.success(updatedCategory, 'Cập nhật thông tin thể loại thành công');
  }

  /**
   * DELETE /categories/:id - Xóa thể loại
   */
  @Delete(':id')
  @RequirePermissions('CATEGORY_DELETE')
  @ApiOperation({ summary: 'Xóa thể loại' })
  async deleteCategory(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.categoryService.deleteCategory(id);
    return ApiResponse.success(null, 'Xóa thể loại thành công');
  }
}
