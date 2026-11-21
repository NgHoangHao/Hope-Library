import { Controller, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { DashboardService } from '../service/dashboard.service.js';
import { DashboardOverviewResponse } from '../model/dashboard/dashboard.dto.js';
import { ApiResponse } from '../common/index.js';
import { TokenHelper } from '../utils/token.helper.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/overview - Lấy dữ liệu thống kê tổng quan cho Dashboard
   */
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy dữ liệu tổng quan Dashboard',
    description:
      'Trả về các chỉ số thống kê (tổng bản sao sách, đang cho mượn, thành viên, quá hạn), biểu đồ hoạt động mượn sách từ thứ 2 đến chủ nhật tuần trước, top sách được yêu thích theo LoanItem (BORROWED, RETURNED) và danh sách mượn trả gần đây.',
  })
  async getOverview(
    @Req() req: Request,
  ): Promise<ApiResponse<DashboardOverviewResponse>> {
    const token = TokenHelper.extractTokenFromRequest(req);
    TokenHelper.decodeToken(token);

    const data = await this.dashboardService.getOverview();
    return ApiResponse.success(data, 'Lấy dữ liệu tổng quan dashboard thành công');
  }
}
