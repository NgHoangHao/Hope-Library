import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AutoMap } from '@automapper/classes';
import { FineStatus } from './fine.entity.js';

export { FineStatus };

export class UpdateFineStatusDto {
  @ApiProperty({
    enum: FineStatus,
    description: 'Trạng thái mới của khoản tiền phạt (UNPAID, PAID, WAIVED)',
    example: FineStatus.PAID,
  })
  status: FineStatus;
}

export class FineResponse {
  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã định danh tiền phạt (UUID)' })
  id: string;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Mã người dùng (User UUID)' })
  userId: string;

  @AutoMap(() => String)
  @ApiPropertyOptional({ description: 'Mã phiếu mượn (Loan UUID)' })
  loanId?: string | null;

  @AutoMap(() => Number)
  @ApiProperty({ description: 'Số tiền phạt' })
  amount: number;

  @AutoMap(() => String)
  @ApiProperty({ description: 'Lý do phạt' })
  reason: string;

  @AutoMap(() => String)
  @ApiProperty({ enum: FineStatus, description: 'Trạng thái tiền phạt' })
  status: FineStatus;

  @AutoMap(() => Date)
  @ApiPropertyOptional({ description: 'Ngày nộp phạt' })
  paidAt?: Date | null;

  @AutoMap(() => Date)
  @ApiProperty({ description: 'Thời điểm tạo' })
  createdAt: Date;

  constructor(partial?: Partial<FineResponse>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

