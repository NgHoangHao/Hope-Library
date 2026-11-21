"use client";

import React from "react";
import { BookOpen, ArrowLeftRight, PenTool, Bell } from "lucide-react";
import { DashboardStatsData } from "../types/dashboard.types";

interface DashboardStatsCardsProps {
  stats?: DashboardStatsData;
  isLoading: boolean;
}

function formatNumber(value: number): string {
  return value.toLocaleString("vi-VN");
}

export function DashboardStatsCards({
  stats,
  isLoading,
}: DashboardStatsCardsProps) {
  const totalBookCopies = stats?.totalBookCopies ?? 0;
  const newBookCopiesThisMonth = stats?.newBookCopiesThisMonth ?? 0;
  const borrowedCopies = stats?.borrowedCopies ?? 0;
  const borrowCapacityRate = stats?.borrowCapacityRate ?? 0;
  const totalMembers = stats?.totalMembers ?? 0;
  const newMembersThisWeek = stats?.newMembersThisWeek ?? 0;
  const overdueLoans = stats?.overdueLoans ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Tổng đầu sách (số lượng BookCopy) */}
      <div className="bg-[#F5B82E] rounded-2xl p-6 text-[#1A1A1A] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[145px] transition-transform hover:-translate-y-0.5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-wider uppercase opacity-90">
            TỔNG ĐẦU SÁCH
          </span>
          <div className="w-8 h-8 rounded-lg border border-[#1A1A1A]/30 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[#1A1A1A]" />
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="h-9 w-24 rounded-lg bg-[#1A1A1A]/15 animate-pulse" />
          ) : (
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatNumber(totalBookCopies)}
            </div>
          )}
          <div className="text-xs font-semibold text-[#1A1A1A]/75 mt-1.5">
            {isLoading
              ? "Đang tải..."
              : `+${formatNumber(newBookCopiesThisMonth)} tháng này`}
          </div>
        </div>
      </div>

      {/* Card 2: Đang cho mượn (BookCopy có status BORROWED) */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-2xs relative flex flex-col justify-between min-h-[145px] transition-transform hover:-translate-y-0.5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-neutral-500 tracking-wider uppercase">
            ĐANG CHO MƯỢN
          </span>
          <div className="w-8 h-8 rounded-lg border border-neutral-200/80 flex items-center justify-center text-neutral-700">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="h-9 w-20 rounded-lg bg-neutral-100 animate-pulse" />
          ) : (
            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              {formatNumber(borrowedCopies)}
            </div>
          )}
          <div className="text-xs font-semibold text-teal-600 mt-1.5">
            {isLoading ? "Đang tải..." : `${borrowCapacityRate}% công suất`}
          </div>
        </div>
      </div>

      {/* Card 3: Thành viên */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-2xs relative flex flex-col justify-between min-h-[145px] transition-transform hover:-translate-y-0.5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-neutral-500 tracking-wider uppercase">
            THÀNH VIÊN
          </span>
          <div className="w-8 h-8 rounded-lg border border-neutral-200/80 flex items-center justify-center text-neutral-700">
            <PenTool className="w-4 h-4" />
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="h-9 w-20 rounded-lg bg-neutral-100 animate-pulse" />
          ) : (
            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              {formatNumber(totalMembers)}
            </div>
          )}
          <div className="text-xs font-semibold text-neutral-500 mt-1.5">
            {isLoading
              ? "Đang tải..."
              : `+${formatNumber(newMembersThisWeek)} tuần này`}
          </div>
        </div>
      </div>

      {/* Card 4: Quá hạn */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-2xs relative flex flex-col justify-between min-h-[145px] transition-transform hover:-translate-y-0.5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-neutral-500 tracking-wider uppercase">
            QUÁ HẠN
          </span>
          <div className="w-8 h-8 rounded-lg border border-neutral-200/80 flex items-center justify-center text-neutral-700">
            <Bell className="w-4 h-4" />
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="h-9 w-16 rounded-lg bg-neutral-100 animate-pulse" />
          ) : (
            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              {formatNumber(overdueLoans)}
            </div>
          )}
          <div
            className={`text-xs font-semibold mt-1.5 ${
              overdueLoans > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {isLoading
              ? "Đang tải..."
              : overdueLoans > 0
                ? "Cần xử lý"
                : "Ổn định"}
          </div>
        </div>
      </div>
    </div>
  );
}
