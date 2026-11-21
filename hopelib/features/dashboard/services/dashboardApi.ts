import { apiFetch } from "@/features/auth";
import { DashboardOverviewData } from "../types/dashboard.types";

/**
 * Gọi API GET /dashboard/overview để lấy toàn bộ dữ liệu thống kê Dashboard
 */
export async function getDashboardOverviewApi(
  token?: string
): Promise<DashboardOverviewData> {
  const data = await apiFetch<DashboardOverviewData>("/dashboard/overview", {
    method: "GET",
    token,
  });

  return {
    stats: {
      totalBookCopies: data?.stats?.totalBookCopies ?? 0,
      newBookCopiesThisMonth: data?.stats?.newBookCopiesThisMonth ?? 0,
      borrowedCopies: data?.stats?.borrowedCopies ?? 0,
      borrowCapacityRate: data?.stats?.borrowCapacityRate ?? 0,
      totalMembers: data?.stats?.totalMembers ?? 0,
      newMembersThisWeek: data?.stats?.newMembersThisWeek ?? 0,
      overdueLoans: data?.stats?.overdueLoans ?? 0,
    },
    weeklyBorrowActivity: Array.isArray(data?.weeklyBorrowActivity)
      ? data.weeklyBorrowActivity
      : [],
    chartRange: data?.chartRange ?? { from: "", to: "" },
    weeklyGrowthPercent: data?.weeklyGrowthPercent ?? null,
    popularBooks: Array.isArray(data?.popularBooks) ? data.popularBooks : [],
    recentLoans: Array.isArray(data?.recentLoans) ? data.recentLoans : [],
    updatedAt: data?.updatedAt ?? new Date().toISOString(),
  };
}
