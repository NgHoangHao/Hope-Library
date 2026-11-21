import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditLogService } from '../service/audit-log.service.js';
import {
  AuditLogAction,
  AuditLogResponse,
  PaginatedAuditLogResponse,
  QueryAuditLogDto,
} from '../model/audit-log/audit-log.dto.js';
import { ApiResponse } from '../common/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@ApiTags('AuditLogs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * GET /audit-logs - Lấy danh sách nhật ký kiểm toán có phân trang, tìm kiếm theo tên user và lọc theo POST/PUT/DELETE
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('AUDIT_LOG_READ')
  @ApiOperation({
    summary: 'Lấy danh sách nhật ký kiểm toán có phân trang',
    description:
      'Hỗ trợ phân trang (page bắt đầu từ 1, size), tìm kiếm theo tên người dùng (search: fullName, username, email), và lọc theo loại thao tác CRUD (action: POST, PUT, DELETE).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: 'Số lượng bản ghi mỗi trang',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên người dùng (fullName, username hoặc email)',
    example: 'Nguyen Van A',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: AuditLogAction,
    description: 'Lọc theo thao tác CRUD (POST, PUT, DELETE)',
    example: 'POST',
  })
  async getAuditLogs(
    @Query() query: QueryAuditLogDto,
  ): Promise<ApiResponse<PaginatedAuditLogResponse>> {
    const logs = await this.auditLogService.getAuditLogs(query);
    return ApiResponse.success(logs, 'Lấy danh sách nhật ký kiểm toán thành công');
  }

  /**
   * GET /audit-logs/:id - Lấy chi tiết một bản ghi nhật ký kiểm toán
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('AUDIT_LOG_READ')
  @ApiOperation({
    summary: 'Lấy chi tiết nhật ký kiểm toán theo ID',
    description: 'Trả về thông tin chi tiết của bản ghi nhật ký bao gồm thông tin user thực hiện và chi tiết request/response.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh nhật ký kiểm toán (UUID)',
    type: String,
  })
  async getAuditLogById(@Param('id') id: string): Promise<ApiResponse<AuditLogResponse>> {
    const log = await this.auditLogService.getAuditLogById(id);
    return ApiResponse.success(log, 'Lấy chi tiết nhật ký kiểm toán thành công');
  }
}

