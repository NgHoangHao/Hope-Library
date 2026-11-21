export interface DashboardStatsData {
  totalBookCopies: number;
  newBookCopiesThisMonth: number;
  borrowedCopies: number;
  borrowCapacityRate: number;
  totalMembers: number;
  newMembersThisWeek: number;
  overdueLoans: number;
}

export interface DashboardChartItemData {
  day: string;
  date: string;
  count: number;
}

export interface DashboardChartRangeData {
  from: string;
  to: string;
}

export interface DashboardPopularBookData {
  rank: number;
  bookId: string;
  title: string;
  author: string;
  borrowCount: number;
}

export interface DashboardRecentLoanData {
  id: string;
  code: string;
  memberName: string;
  bookTitle: string;
  bookCount: number;
  borrowDate: string;
  dueDate: string;
  status: string;
}

export interface DashboardOverviewData {
  stats: DashboardStatsData;
  weeklyBorrowActivity: DashboardChartItemData[];
  chartRange: DashboardChartRangeData;
  weeklyGrowthPercent: number | null;
  popularBooks: DashboardPopularBookData[];
  recentLoans: DashboardRecentLoanData[];
  updatedAt: string;
}
