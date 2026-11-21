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
import { RoleService } from '../service/role.service.js';
import { CreateRoleDto, RoleResponse, UpdateRoleDto } from '../model/role/role.dto.js';
import { ApiResponse } from '../common/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  /**
   * GET /roles - Lấy danh sách tất cả vai trò (không phân trang), trả về RoleResponse[]
   */
  @Get()
  @RequirePermissions('ROLE_READ')
  @ApiOperation({ summary: 'Lấy danh sách tất cả vai trò' })
  async getRoles(): Promise<ApiResponse<RoleResponse[]>> {
    const roles = await this.roleService.getAllRoles();
    return ApiResponse.success(roles, 'Lấy danh sách vai trò thành công');
  }

  /**
   * GET /roles/:id - Lấy chi tiết vai trò theo ID
   */
  @Get(':id')
  @RequirePermissions('ROLE_READ')
  @ApiOperation({ summary: 'Lấy chi tiết vai trò theo ID' })
  async getRoleById(@Param('id') id: string): Promise<ApiResponse<RoleResponse>> {
    const role = await this.roleService.getRoleById(id);
    return ApiResponse.success(role, 'Lấy thông tin vai trò thành công');
  }

  /**
   * POST /roles - Thêm mới vai trò (truyền vào name, description)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('ROLE_CREATE')
  @ApiOperation({ summary: 'Thêm mới vai trò' })
  async createRole(@Body() createRoleDto: CreateRoleDto): Promise<ApiResponse<RoleResponse>> {
    const role = await this.roleService.createRole(createRoleDto);
    return ApiResponse.created(role, 'Thêm mới vai trò thành công');
  }

  /**
   * PUT /roles/:id - Cập nhật thông tin vai trò
   */
  @Put(':id')
  @RequirePermissions('ROLE_UPDATE')
  @ApiOperation({ summary: 'Cập nhật thông tin vai trò' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<ApiResponse<RoleResponse>> {
    const updatedRole = await this.roleService.updateRole(id, updateRoleDto);
    return ApiResponse.success(updatedRole, 'Cập nhật vai trò thành công');
  }

  /**
   * DELETE /roles/:id - Xóa vai trò
   */
  @Delete(':id')
  @RequirePermissions('ROLE_DELETE')
  @ApiOperation({ summary: 'Xóa vai trò' })
  async deleteRole(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.roleService.deleteRole(id);
    return ApiResponse.success(null, 'Xóa vai trò thành công');
  }
}
