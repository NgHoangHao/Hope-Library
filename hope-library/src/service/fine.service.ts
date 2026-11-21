import { Injectable } from '@nestjs/common';
import { FineRepository } from '../repository/fine.repository.js';
import { FineMapper } from '../mapper/fine.mapper.js';
import { FineStatus } from '../model/fine/fine.entity.js';
import { FineResponse, UpdateFineStatusDto } from '../model/fine/fine.dto.js';
import { AppException } from '../common/index.js';

@Injectable()
export class FineService {
  constructor(
    private readonly fineRepo: FineRepository,
    private readonly fineMapper: FineMapper,
  ) {}

  /**
   * Cập nhật trạng thái khoản tiền phạt (UNPAID, PAID, WAIVED)
   */
  async updateFineStatus(
    id: string,
    dto: UpdateFineStatusDto,
  ): Promise<FineResponse> {
    const trimmedId = id?.trim();
    if (!trimmedId) {
      throw AppException.badRequest(
        'Mã khoản tiền phạt (id) không được để trống',
        { id },
        'FINE_ID_REQUIRED',
      );
    }

    const validStatuses = Object.values(FineStatus);
    if (!dto?.status || !validStatuses.includes(dto.status)) {
      throw AppException.badRequest(
        `Trạng thái tiền phạt không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`,
        { status: dto?.status, validStatuses },
        'INVALID_FINE_STATUS',
      );
    }

    const fine = await this.fineRepo.findById(trimmedId);
    if (!fine) {
      throw AppException.notFound(
        `Không tìm thấy khoản tiền phạt với ID: ${trimmedId}`,
        { id: trimmedId },
        'FINE_NOT_FOUND',
      );
    }

    const previousStatus = fine.status;
    fine.status = dto.status;

    if (dto.status === FineStatus.PAID) {
      if (previousStatus !== FineStatus.PAID || !fine.paidAt) {
        fine.paidAt = new Date();
      }
    } else {
      fine.paidAt = null;
    }

    const updated = await this.fineRepo.save(fine);
    return this.fineMapper.toResponse(updated);
  }
}
