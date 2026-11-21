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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SystemConfigService } from '../service/system-config.service.js';
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
  SystemConfigResponse,
} from '../model/system-config/system-config.dto.js';
import { ApiResponse } from '../common/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@ApiTags('System Configs')
@ApiBearerAuth()
@Controller('system-configs')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  private extractActor(req?: Request): string | undefined {
    const user = (req as any)?.user;
    return user?.email || user?.userId || user?.sub || undefined;
  }

  /**
   * GET /system-configs - Lấy danh sách toàn bộ cấu hình hệ thống (có thể lọc theo group)
   */
  @Get()
  @RequirePermissions('SYSTEM_CONFIG_READ')
  @ApiOperation({ summary: 'Lấy danh sách tất cả cấu hình hệ thống (ưu tiên đọc từ Redis Cache)' })
  @ApiQuery({
    name: 'group',
    required: false,
    description: 'Lọc cấu hình theo nhóm (ví dụ: LOAN, FINE, SYSTEM)',
  })
  async getAllConfigs(
    @Query('group') group?: string,
  ): Promise<ApiResponse<SystemConfigResponse[]>> {
    const configs = await this.systemConfigService.getAllConfigs(group);
    return ApiResponse.success(configs, 'Lấy danh sách cấu hình hệ thống thành công');
  }

  /**
   * GET /system-configs/key/:key - Lấy cấu hình theo key (ưu tiên đọc từ Redis Cache)
   */
  @Get('key/:key')
  @RequirePermissions('SYSTEM_CONFIG_READ')
  @ApiOperation({ summary: 'Lấy chi tiết cấu hình hệ thống theo key (Cache-Aside Redis)' })
  async getConfigByKey(
    @Param('key') key: string,
  ): Promise<ApiResponse<SystemConfigResponse>> {
    const config = await this.systemConfigService.getConfigByKey(key);
    return ApiResponse.success(config, 'Lấy thông tin cấu hình hệ thống thành công');
  }

  /**
   * GET /system-configs/:id - Lấy chi tiết cấu hình theo ID
   */
  @Get(':id')
  @RequirePermissions('SYSTEM_CONFIG_READ')
  @ApiOperation({ summary: 'Lấy chi tiết cấu hình hệ thống theo ID' })
  async getConfigById(
    @Param('id') id: string,
  ): Promise<ApiResponse<SystemConfigResponse>> {
    const config = await this.systemConfigService.getConfigById(id);
    return ApiResponse.success(config, 'Lấy thông tin cấu hình hệ thống thành công');
  }

  /**
   * POST /system-configs - Tạo mới cấu hình hệ thống
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('SYSTEM_CONFIG_CREATE')
  @ApiOperation({ summary: 'Thêm mới cấu hình hệ thống và đồng bộ Redis Cache' })
  async createConfig(
    @Body() createDto: CreateSystemConfigDto,
    @Req() req?: Request,
  ): Promise<ApiResponse<SystemConfigResponse>> {
    const config = await this.systemConfigService.createConfig(
      createDto,
      this.extractActor(req),
    );
    return ApiResponse.created(config, 'Thêm mới cấu hình hệ thống thành công');
  }

  /**
   * PUT /system-configs/key/:key - Cập nhật cấu hình trực tiếp theo key
   */
  @Put('key/:key')
  @RequirePermissions('SYSTEM_CONFIG_UPDATE')
  @ApiOperation({ summary: 'Cập nhật cấu hình hệ thống theo key và cập nhật Redis Cache ngay lập tức' })
  async updateConfigByKey(
    @Param('key') key: string,
    @Body() updateDto: UpdateSystemConfigDto,
    @Req() req?: Request,
  ): Promise<ApiResponse<SystemConfigResponse>> {
    const updated = await this.systemConfigService.updateConfigByKey(
      key,
      updateDto,
      this.extractActor(req),
    );
    return ApiResponse.success(updated, 'Cập nhật cấu hình hệ thống thành công');
  }

  /**
   * PUT /system-configs/:id - Cập nhật cấu hình theo ID
   */
  @Put(':id')
  @RequirePermissions('SYSTEM_CONFIG_UPDATE')
  @ApiOperation({ summary: 'Cập nhật cấu hình hệ thống theo ID và cập nhật Redis Cache ngay lập tức' })
  async updateConfig(
    @Param('id') id: string,
    @Body() updateDto: UpdateSystemConfigDto,
    @Req() req?: Request,
  ): Promise<ApiResponse<SystemConfigResponse>> {
    const updated = await this.systemConfigService.updateConfig(
      id,
      updateDto,
      this.extractActor(req),
    );
    return ApiResponse.success(updated, 'Cập nhật cấu hình hệ thống thành công');
  }

  /**
   * DELETE /system-configs/:id - Xóa cấu hình theo ID
   */
  @Delete(':id')
  @RequirePermissions('SYSTEM_CONFIG_DELETE')
  @ApiOperation({ summary: 'Xóa cấu hình hệ thống và xóa key tương ứng khỏi Redis Cache' })
  async deleteConfig(@Param('id') id: string): Promise<ApiResponse<null>> {
    await this.systemConfigService.deleteConfig(id);
    return ApiResponse.success(null, 'Xóa cấu hình hệ thống thành công');
  }
}
