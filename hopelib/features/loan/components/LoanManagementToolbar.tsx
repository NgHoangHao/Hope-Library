"use client";

import React from "react";
import { Filter, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import { LoanStatus } from "../types/loan.types";
import { LOAN_STATUS_CONFIG } from "../utils/loanDisplay";

const STATUS_FILTER_OPTIONS: Array<{ value: LoanStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: LOAN_STATUS_CONFIG.PENDING.label },
  { value: "BORROWED", label: LOAN_STATUS_CONFIG.BORROWED.label },
  { value: "OVERDUE", label: LOAN_STATUS_CONFIG.OVERDUE.label },
  { value: "RETURNED", label: LOAN_STATUS_CONFIG.RETURNED.label },
  { value: "CANCELLED", label: LOAN_STATUS_CONFIG.CANCELLED.label },
  { value: "EXPIRED", label: LOAN_STATUS_CONFIG.EXPIRED.label },
];

export interface LoanManagementToolbarProps {
  selectedStatus: LoanStatus | "ALL";
  onStatusChange: (status: LoanStatus | "ALL") => void;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  submittedSearch: string;
  onSearchSubmit: (e?: React.FormEvent) => void;
  onSearchClear: () => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  total: number;
}

export function LoanManagementToolbar({
  selectedStatus,
  onStatusChange,
  searchDraft,
  onSearchDraftChange,
  submittedSearch,
  onSearchSubmit,
  onSearchClear,
  onResetFilters,
  onRefresh,
  isLoading,
  total,
}: LoanManagementToolbarProps) {
  const hasActiveFilter =
    selectedStatus !== "ALL" ||
    searchDraft.trim() !== "" ||
    submittedSearch.trim() !== "";

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Row 1: Search form (chỉ gọi API khi bấm nút Tìm kiếm) + Status Select Filter (gọi API ngay khi chọn) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <form
          onSubmit={onSearchSubmit}
          className="flex flex-1 items-center gap-2 max-w-xl"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => onSearchDraftChange(e.target.value)}
              placeholder="Tìm theo tên độc giả, email, username hoặc mã phiếu..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#B8860B] transition-colors"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={onSearchClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                title="Xóa từ khóa tìm kiếm"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#e5a922] text-[#1A1A1A] text-xs sm:text-sm font-semibold shadow-2xs transition-colors disabled:opacity-60 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Tìm kiếm</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown lọc trạng thái (gọi API ngay khi chọn) */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedStatus}
              onChange={(e) =>
                onStatusChange(e.target.value as LoanStatus | "ALL")
              }
              aria-label="Lọc theo trạng thái phiếu mượn"
              className="pl-8 pr-8 py-2 text-xs sm:text-sm font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:bg-white focus:border-[#B8860B] transition-colors cursor-pointer"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50 transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Row 2: Quick Status Filter Chips (gọi API ngay khi chọn) + Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTER_OPTIONS.map((tab) => {
            const isActive = selectedStatus === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusChange(tab.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs"
                    : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                {tab.value === "ALL" ? "Tất cả" : tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-stone-500 shrink-0">
          Tìm thấy <span className="font-semibold text-stone-900">{total}</span>{" "}
          phiếu mượn
          {submittedSearch ? (
            <>
              {" "}
              cho từ khóa{" "}
              <span className="font-semibold text-amber-700">
                &quot;{submittedSearch}&quot;
              </span>
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}
