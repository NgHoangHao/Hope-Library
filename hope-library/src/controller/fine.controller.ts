import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FineService } from '../service/fine.service.js';
import {
  FineResponse,
  UpdateFineStatusDto,
} from '../model/fine/fine.dto.js';
import { ApiResponse } from '../common/index.js';
import { RequirePermissions } from '../decorator/permissions.decorator.js';

@ApiTags('Fines')
@ApiBearerAuth()
@Controller('fines')
export class FineController {
  constructor(private readonly fineService: FineService) {}

  /**
   * PATCH /fines/:id/status - Cập nhật trạng thái khoản tiền phạt
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('FINE_UPDATE')
  @ApiOperation({
    summary: 'Cập nhật trạng thái khoản tiền phạt',
    description:
      'Đổi trạng thái khoản tiền phạt giữa UNPAID, PAID, WAIVED. Khi chuyển sang PAID sẽ tự động cập nhật thời điểm paidAt; khi chuyển sang UNPAID hoặc WAIVED sẽ xóa paidAt.',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh khoản tiền phạt (UUID)',
    type: String,
  })
  async updateFineStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFineStatusDto,
  ): Promise<ApiResponse<FineResponse>> {
    const updatedFine = await this.fineService.updateFineStatus(id, dto);
    return ApiResponse.success(
      updatedFine,
      'Cập nhật trạng thái khoản tiền phạt thành công',
    );
  }
}
