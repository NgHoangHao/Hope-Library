"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { useDashboardData } from "../hooks/useDashboardData";
import { DashboardStatsCards } from "./DashboardStatsCards";
import { DashboardBorrowChart } from "./DashboardBorrowChart";
import { DashboardPopularBooks } from "./DashboardPopularBooks";
import { DashboardRecentLoans } from "./DashboardRecentLoans";

export function DashboardOverview() {
  const {
    data,
    isLoading,
    error,
    displayName,
    greeting,
    todayLabel,
    refetch,
  } = useDashboardData();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {todayLabel && (
            <div className="text-[#C68A14] font-bold text-xs tracking-widest uppercase mb-1.5">
              {todayLabel}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-1">
            Đây là tình hình thư viện của bạn hôm nay.
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 text-rose-700 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-semibold text-xs hover:bg-rose-100/60 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <DashboardStatsCards stats={data?.stats} isLoading={isLoading} />

      {/* Middle Row: Biểu đồ & Sách yêu thích */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardBorrowChart
          data={data?.weeklyBorrowActivity ?? []}
          chartRange={data?.chartRange}
          weeklyGrowthPercent={data?.weeklyGrowthPercent}
          isLoading={isLoading}
        />
        <DashboardPopularBooks
          books={data?.popularBooks ?? []}
          updatedAt={data?.updatedAt}
          isLoading={isLoading}
        />
      </div>

      {/* Bottom Row: Mượn trả gần đây */}
      <DashboardRecentLoans
        loans={data?.recentLoans ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
