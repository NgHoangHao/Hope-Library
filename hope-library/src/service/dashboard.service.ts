import { Injectable } from '@nestjs/common';
import { DashboardRepository } from '../repository/dashboard.repository.js';
import {
  DashboardChartItemDto,
  DashboardOverviewResponse,
  DashboardPopularBookDto,
  DashboardRecentLoanDto,
} from '../model/dashboard/dashboard.dto.js';

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  /**
   * Tổng hợp toàn bộ dữ liệu thống kê cho trang Dashboard Overview
   */
  async getOverview(): Promise<DashboardOverviewResponse> {
    const now = new Date();

    // Đầu tháng hiện tại (00:00:00)
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    // Tính thứ 2 tuần hiện tại (00:00:00)
    const daysSinceMonday = (now.getDay() + 6) % 7;
    const startOfCurrentWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysSinceMonday,
      0,
      0,
      0,
      0,
    );

    // Tuần trước: từ Thứ 2 tuần trước (00:00:00) đến hết Chủ nhật tuần trước (< Thứ 2 tuần này)
    const startOfLastWeek = new Date(startOfCurrentWeek);
    startOfLastWeek.setDate(startOfCurrentWeek.getDate() - 7);

    const endOfLastWeek = new Date(startOfCurrentWeek);
    endOfLastWeek.setDate(startOfCurrentWeek.getDate() - 1);

    // Tuần trước nữa (để tính % tăng trưởng cho biểu đồ)
    const startOfTwoWeeksAgo = new Date(startOfLastWeek);
    startOfTwoWeeksAgo.setDate(startOfLastWeek.getDate() - 7);

    const [
      totalBookCopies,
      newBookCopiesThisMonth,
      borrowedCopies,
      totalMembers,
      newMembersThisWeek,
      overdueLoans,
      lastWeekLoans,
      twoWeeksAgoLoansCount,
      popularBookRows,
      recentLoanEntities,
    ] = await Promise.all([
      this.dashboardRepository.countTotalBookCopies(),
      this.dashboardRepository.countBookCopiesCreatedSince(startOfMonth),
      this.dashboardRepository.countBorrowedBookCopies(),
      this.dashboardRepository.countTotalUsers(),
      this.dashboardRepository.countUsersCreatedSince(startOfCurrentWeek),
      this.dashboardRepository.countOverdueLoans(now),
      this.dashboardRepository.findLoansInDateRange(
        startOfLastWeek,
        startOfCurrentWeek,
      ),
      this.dashboardRepository.countLoansInDateRange(
        startOfTwoWeeksAgo,
        startOfLastWeek,
      ),
      this.dashboardRepository.findPopularBooks(3),
      this.dashboardRepository.findRecentLoans(5),
    ]);

    const borrowCapacityRate =
      totalBookCopies > 0
        ? Math.round((borrowedCopies / totalBookCopies) * 100)
        : 0;

    // Gom nhóm số lượt mượn theo từng ngày Thứ 2 -> Chủ nhật của tuần trước
    const dailyCountMap = new Map<string, number>();
    for (const loan of lastWeekLoans) {
      if (!loan.loanDate) continue;
      const dateKey = formatLocalDateKey(new Date(loan.loanDate));
      dailyCountMap.set(dateKey, (dailyCountMap.get(dateKey) ?? 0) + 1);
    }

    const weeklyBorrowActivity: DashboardChartItemDto[] = WEEKDAY_LABELS.map(
      (dayLabel, index) => {
        const dayDate = new Date(startOfLastWeek);
        dayDate.setDate(startOfLastWeek.getDate() + index);
        const dateKey = formatLocalDateKey(dayDate);

        return {
          day: dayLabel,
          date: dateKey,
          count: dailyCountMap.get(dateKey) ?? 0,
        };
      },
    );

    const lastWeekTotal = lastWeekLoans.length;
    let weeklyGrowthPercent: number | null = 0;
    if (twoWeeksAgoLoansCount > 0) {
      weeklyGrowthPercent = Number(
        (
          ((lastWeekTotal - twoWeeksAgoLoansCount) / twoWeeksAgoLoansCount) *
          100
        ).toFixed(1),
      );
    } else if (lastWeekTotal > 0) {
      weeklyGrowthPercent = 100;
    }

    const popularBooks: DashboardPopularBookDto[] = popularBookRows.map(
      (row, index) => ({
        rank: index + 1,
        bookId: row.book.id,
        title: row.book.title,
        author: row.book.author?.name || 'Chưa cập nhật',
        borrowCount: row.borrowCount,
      }),
    );

    const recentLoans: DashboardRecentLoanDto[] = recentLoanEntities.map(
      (loan) => {
        const items = loan.loanItems ?? [];
        const firstBookTitle =
          items[0]?.bookCopy?.book?.title || 'Không xác định';
        const bookCount = items.length;

        return {
          id: loan.id,
          code: `LM-${loan.id.slice(0, 6).toUpperCase()}`,
          memberName:
            loan.user?.fullName || loan.user?.username || 'Không xác định',
          bookTitle:
            bookCount > 1
              ? `${firstBookTitle} (+${bookCount - 1})`
              : firstBookTitle,
          bookCount,
          borrowDate: loan.loanDate,
          dueDate: loan.dueDate,
          status: loan.status,
        };
      },
    );

    return {
      stats: {
        totalBookCopies,
        newBookCopiesThisMonth,
        borrowedCopies,
        borrowCapacityRate,
        totalMembers,
        newMembersThisWeek,
        overdueLoans,
      },
      weeklyBorrowActivity,
      chartRange: {
        from: formatLocalDateKey(startOfLastWeek),
        to: formatLocalDateKey(endOfLastWeek),
      },
      weeklyGrowthPercent,
      popularBooks,
      recentLoans,
      updatedAt: now.toISOString(),
    };
  }
}
