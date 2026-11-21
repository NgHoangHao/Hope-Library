import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Tổng số bản sao sách (BookCopy) trong thư viện', example: 2480 })
  totalBookCopies: number;

  @ApiProperty({ description: 'Số bản sao sách được thêm mới trong tháng này', example: 12 })
  newBookCopiesThisMonth: number;

  @ApiProperty({ description: 'Tổng số bản sao sách đang có trạng thái BORROWED', example: 186 })
  borrowedCopies: number;

  @ApiProperty({ description: 'Tỷ lệ phần trăm công suất cho mượn (borrowedCopies / totalBookCopies)', example: 76 })
  borrowCapacityRate: number;

  @ApiProperty({ description: 'Tổng số thành viên trong hệ thống', example: 1294 })
  totalMembers: number;

  @ApiProperty({ description: 'Số thành viên mới đăng ký trong tuần này', example: 24 })
  newMembersThisWeek: number;

  @ApiProperty({ description: 'Tổng số phiếu mượn đang quá hạn', example: 18 })
  overdueLoans: number;
}

export class DashboardChartItemDto {
  @ApiProperty({ description: 'Nhãn thứ trong tuần (T2 -> CN)', example: 'T2' })
  day: string;

  @ApiProperty({ description: 'Ngày cụ thể (YYYY-MM-DD)', example: '2026-11-09' })
  date: string;

  @ApiProperty({ description: 'Số lượt mượn sách trong ngày', example: 48 })
  count: number;
}

export class DashboardChartRangeDto {
  @ApiProperty({ description: 'Ngày bắt đầu (Thứ 2 tuần trước, YYYY-MM-DD)', example: '2026-11-09' })
  from: string;

  @ApiProperty({ description: 'Ngày kết thúc (Chủ nhật tuần trước, YYYY-MM-DD)', example: '2026-11-15' })
  to: string;
}

export class DashboardPopularBookDto {
  @ApiProperty({ description: 'Thứ hạng', example: 1 })
  rank: number;

  @ApiProperty({ description: 'ID đầu sách (UUID)' })
  bookId: string;

  @ApiProperty({ description: 'Tên sách', example: 'Nhà giả kim' })
  title: string;

  @ApiProperty({ description: 'Tên tác giả', example: 'Paulo Coelho' })
  author: string;

  @ApiProperty({
    description: 'Tổng số lượt mượn tính theo LoanItem có status là BORROWED và RETURNED',
    example: 128,
  })
  borrowCount: number;
}

export class DashboardRecentLoanDto {
  @ApiProperty({ description: 'ID phiếu mượn (UUID)' })
  id: string;

  @ApiProperty({ description: 'Mã hiển thị phiếu mượn', example: 'LM-A1B2C3' })
  code: string;

  @ApiProperty({ description: 'Tên thành viên mượn sách', example: 'Nguyễn Minh Anh' })
  memberName: string;

  @ApiProperty({ description: 'Tên sách đại diện trong phiếu mượn', example: 'Nhà giả kim' })
  bookTitle: string;

  @ApiProperty({ description: 'Tổng số sách trong phiếu mượn', example: 2 })
  bookCount: number;

  @ApiProperty({ description: 'Ngày mượn sách' })
  borrowDate: Date;

  @ApiProperty({ description: 'Hạn trả sách' })
  dueDate: Date;

  @ApiProperty({ description: 'Trạng thái phiếu mượn', example: 'BORROWED' })
  status: string;
}

export class DashboardOverviewResponse {
  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ type: [DashboardChartItemDto] })
  weeklyBorrowActivity: DashboardChartItemDto[];

  @ApiProperty({ type: DashboardChartRangeDto })
  chartRange: DashboardChartRangeDto;

  @ApiProperty({
    description: 'Tỷ lệ tăng trưởng lượt mượn tuần trước so với tuần trước nữa (%)',
    example: 18.2,
    nullable: true,
  })
  weeklyGrowthPercent: number | null;

  @ApiProperty({ type: [DashboardPopularBookDto] })
  popularBooks: DashboardPopularBookDto[];

  @ApiProperty({ type: [DashboardRecentLoanDto] })
  recentLoans: DashboardRecentLoanDto[];

  @ApiProperty({ description: 'Thời điểm cập nhật dữ liệu (ISO string)' })
  updatedAt: string;
}
