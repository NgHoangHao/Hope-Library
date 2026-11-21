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
import { PermissionService } from '../service/permission.service.js';
import {
  CreatePermissionDto,
  PermissionResponse,
  UpdatePermissionDto,
} from '../model/permission/permission.dto.js';
import { ApiResponse } from '../common/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';
import { TokenHelper } from '../utils/token.helper.js';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  /**
   * GET /permissions - Lấy danh sách quyền hạn (không phân trang), hỗ trợ lọc theo roleId
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('PERMISSION_READ')
  @ApiOperation({
    summary: 'Lấy danh sách quyền hạn',
    description:
      'Truy vấn toàn bộ các quyền hạn hiện có trong hệ thống hoặc lọc theo roleId nếu được truyền vào.',
  })
  @ApiQuery({
    name: 'roleId',
    required: false,
    description: 'Mã định danh vai trò (tùy chọn) để lọc danh sách quyền hạn theo vai trò',
    type: String,
  })
  async getPermissions(
    @Query('roleId') roleId?: string,
  ): Promise<ApiResponse<PermissionResponse[]>> {
    const permissions = roleId
      ? await this.permissionService.getPermissionsByRoleId(roleId)
      : await this.permissionService.getAllPermissions();
    return ApiResponse.success(
      permissions,
      roleId
        ? 'Lấy danh sách quyền hạn theo vai trò thành công'
        : 'Lấy danh sách quyền hạn thành công',
    );
  }

  /**
   * GET /permissions/role (hỗ trợ alias /permissions/me) - Lấy danh sách quyền hạn của vai trò người dùng từ token
   */
  @Get(['role', 'me'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách quyền hạn theo vai trò người dùng từ token',
    description:
      'Trích xuất token của người dùng, xác định các vai trò hoặc quyền hạn tương ứng của người dùng và trả về danh sách quyền hạn.',
  })
  async getPermissionsByToken(
    @Req() req: Request,
  ): Promise<ApiResponse<PermissionResponse[]>> {
    const token = TokenHelper.extractTokenFromRequest(req);
    const permissions = await this.permissionService.getPermissionsByToken(token);
    return ApiResponse.success(permissions, 'Lấy danh sách quyền hạn theo vai trò thành công');
  }

  /**
   * GET /permissions/role/:roleId (hỗ trợ alias /permissions/roles/:roleId) - Lấy danh sách quyền hạn theo roleId
   */
  @Get(['role/:roleId', 'roles/:roleId'])
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('PERMISSION_READ')
  @ApiOperation({
    summary: 'Lấy danh sách quyền hạn theo vai trò (roleId)',
    description: 'Truy vấn danh sách các quyền hạn được gán cho một vai trò cụ thể dựa vào roleId.',
  })
  @ApiParam({
    name: 'roleId',
    description: 'Mã định danh UUID của vai trò',
    type: String,
  })
  async getPermissionsByRoleId(
    @Param('roleId') roleId: string,
  ): Promise<ApiResponse<PermissionResponse[]>> {
    const permissions = await this.permissionService.getPermissionsByRoleId(roleId);
    return ApiResponse.success(permissions, 'Lấy danh sách quyền hạn theo vai trò thành công');
  }

  /**
   * GET /permissions/:id - Lấy chi tiết quyền hạn theo ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('PERMISSION_READ')
  @ApiOperation({
    summary: 'Lấy chi tiết quyền hạn theo ID',
    description: 'Truy vấn chi tiết thông tin quyền hạn theo mã định danh UUID.',
  })
  async getPermissionById(@Param('id') id: string): Promise<ApiResponse<PermissionResponse>> {
    const permission = await this.permissionService.getPermissionById(id);
    return ApiResponse.success(permission, 'Lấy thông tin quyền hạn thành công');
  }

  /**
   * POST /permissions - Thêm mới quyền hạn (code, description)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('PERMISSION_CREATE')
  @ApiOperation({
    summary: 'Thêm mới quyền hạn',
    description: 'Tạo mới quyền hạn với mã code duy nhất (tự động chuyển viết hoa) và mô tả chi tiết.',
  })
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<ApiResponse<PermissionResponse>> {
    const permission = await this.permissionService.createPermission(createPermissionDto);
    return ApiResponse.created(permission, 'Thêm mới quyền hạn thành công');
  }

  /**
   * PUT /permissions/:id - Cập nhật thông tin quyền hạn
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('PERMISSION_UPDATE')
  @ApiOperation({
    summary: 'Cập nhật thông tin quyền hạn',
    description: 'Cập nhật mã quyền hạn hoặc mô tả của quyền hạn theo ID.',
  })
  async updatePermission(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<ApiResponse<PermissionResponse>> {
    const updatedPermission = await this.permissionService.updatePermission(
      id,
      updatePermissionDto,
    );
    return ApiResponse.success(updatedPermission, 'Cập nhật quyền hạn thành công');
  }

  /**
   * DELETE /permissions/:id - Xóa quyền hạn
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('PERMISSION_DELETE')
  @ApiOperation({
    summary: 'Xóa quyền hạn theo ID',
    description: 'Xóa quyền hạn khỏi hệ thống nếu quyền hạn đó chưa được gán cho bất kỳ vai trò nào.',
  })
  async deletePermission(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.permissionService.deletePermission(id);
    return ApiResponse.success(null, 'Xóa quyền hạn thành công');
  }
}
