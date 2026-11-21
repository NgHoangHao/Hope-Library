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
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { NavigationService } from '../service/navigation.service.js';
import {
  CreateNavigationDto,
  NavigationResponse,
  NavigationTreeResponse,
  UpdateNavigationDto,
} from '../model/navigation/navigation.dto.js';
import { ApiResponse } from '../common/index.js';
import { TokenHelper } from '../utils/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@ApiTags('Navigations')
@ApiBearerAuth()
@Controller('navigations')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  /**
   * GET /navigations - Lấy danh sách tất cả các điều hướng (phẳng hoặc cây)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('NAVIGATION_READ')
  @ApiOperation({
    summary: 'Lấy danh sách tất cả các điều hướng',
    description:
      'Truy vấn toàn bộ các menu điều hướng trong hệ thống hoặc theo vai trò. Hỗ trợ query ?tree=true để trả về cấu trúc cây phân cấp.',
  })
  @ApiQuery({
    name: 'tree',
    required: false,
    type: Boolean,
    description: 'Nếu true, trả về cấu trúc cây phân cấp (cha - con)',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    type: String,
    description: 'Mã định danh UUID của vai trò để lọc danh sách điều hướng',
  })
  async getNavigations(
    @Query('tree') tree?: string | boolean,
    @Query('roleId') roleId?: string,
  ): Promise<ApiResponse<NavigationResponse[] | NavigationTreeResponse[]>> {
    const isTree = tree === true || tree === 'true';
    if (isTree) {
      const treeData = roleId
        ? await this.navigationService.getNavigationTreeByRoleId(roleId)
        : await this.navigationService.getNavigationTree();
      return ApiResponse.success(
        treeData,
        roleId
          ? 'Lấy cây phân cấp điều hướng theo vai trò thành công'
          : 'Lấy cây phân cấp điều hướng thành công',
      );
    }

    const navigations = roleId
      ? await this.navigationService.getNavigationsByRoleId(roleId)
      : await this.navigationService.getAllNavigations();
    return ApiResponse.success(
      navigations,
      roleId
        ? 'Lấy danh sách điều hướng theo vai trò thành công'
        : 'Lấy danh sách điều hướng thành công',
    );
  }

  /**
   * GET /navigations/tree - Lấy cấu trúc cây điều hướng (hierarchical tree)
   */
  @Get('tree')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('NAVIGATION_READ')
  @ApiOperation({
    summary: 'Lấy cấu trúc cây phân cấp điều hướng',
    description:
      'Truy vấn danh sách các menu gốc kèm theo các cấp con trực thuộc. Hỗ trợ lọc theo vai trò (roleId).',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    type: String,
    description: 'Mã định danh UUID của vai trò để lọc cây điều hướng theo vai trò',
  })
  async getNavigationTree(
    @Query('roleId') roleId?: string,
  ): Promise<ApiResponse<NavigationTreeResponse[]>> {
    const treeData = roleId
      ? await this.navigationService.getNavigationTreeByRoleId(roleId)
      : await this.navigationService.getNavigationTree();
    return ApiResponse.success(
      treeData,
      roleId
        ? 'Lấy cây phân cấp điều hướng theo vai trò thành công'
        : 'Lấy cây phân cấp điều hướng thành công',
    );
  }

  /**
   * GET /navigations/role - Lấy cấu trúc cây điều hướng theo vai trò từ token
   */
  @Get(['role'])
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('NAVIGATION_READ')
  @ApiOperation({
    summary: 'Lấy cấu trúc cây điều hướng theo vai trò từ token',
    description:
      'Lấy roleId từ Access Token (không cần truyền roleId từ FE). Ưu tiên chọn 1 role theo thứ tự: ADMIN > LIBRARIAN > BORROWER nếu người dùng có nhiều role.',
  })
  async getNavigationTreeByRoleId(
    @Req() req: Request
  ): Promise<ApiResponse<NavigationTreeResponse[]>> {
    try {
      const token = TokenHelper.extractTokenFromRequest(req);
      const treeData = await this.navigationService.getNavigationTreeByToken(token);
      return ApiResponse.success(treeData, 'Lấy cây phân cấp điều hướng theo vai trò thành công');
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /navigations/:id - Lấy chi tiết điều hướng theo ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('NAVIGATION_READ')
  @ApiOperation({
    summary: 'Lấy chi tiết điều hướng theo ID',
    description: 'Truy vấn thông tin chi tiết của một menu điều hướng theo mã định danh UUID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Mã định danh UUID của điều hướng',
  })
  async getNavigationById(@Param('id') id: string): Promise<ApiResponse<NavigationResponse>> {
    const navigation = await this.navigationService.getNavigationById(id);
    return ApiResponse.success(navigation, 'Lấy thông tin điều hướng thành công');
  }

  /**
   * POST /navigations - Thêm mới điều hướng
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('NAVIGATION_CREATE')
  @ApiOperation({
    summary: 'Thêm mới điều hướng',
    description: 'Tạo mới một menu điều hướng trong hệ thống.',
  })
  async createNavigation(
    @Body() createNavigationDto: CreateNavigationDto,
  ): Promise<ApiResponse<NavigationResponse>> {
    const createdNavigation = await this.navigationService.createNavigation(createNavigationDto);
    return ApiResponse.created(createdNavigation, 'Thêm mới điều hướng thành công');
  }

  /**
   * PUT /navigations/:id - Cập nhật thông tin điều hướng
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('NAVIGATION_UPDATE')
  @ApiOperation({
    summary: 'Cập nhật thông tin điều hướng',
    description: 'Cập nhật thông tin chi tiết hoặc liên kết cha con của điều hướng theo ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Mã định danh UUID của điều hướng',
  })
  async updateNavigation(
    @Param('id') id: string,
    @Body() updateNavigationDto: UpdateNavigationDto,
  ): Promise<ApiResponse<NavigationResponse>> {
    const updatedNavigation = await this.navigationService.updateNavigation(
      id,
      updateNavigationDto,
    );
    return ApiResponse.success(updatedNavigation, 'Cập nhật điều hướng thành công');
  }

  /**
   * DELETE /navigations/:id - Xóa điều hướng
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('NAVIGATION_DELETE')
  @ApiOperation({
    summary: 'Xóa điều hướng theo ID',
    description: 'Xóa menu điều hướng khỏi hệ thống nếu không có menu con hoặc chưa gán vào vai trò.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Mã định danh UUID của điều hướng',
  })
  async deleteNavigation(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.navigationService.deleteNavigation(id);
    return ApiResponse.success(null, 'Xóa điều hướng thành công');
  }
}
