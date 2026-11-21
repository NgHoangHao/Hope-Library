"use client";

import React from "react";
import { Search, X, RotateCcw, RefreshCw } from "lucide-react";
import { LoanStatus } from "../types/loan.types";
import { LOAN_STATUS_CONFIG } from "../utils/loanDisplay";

const STATUS_TABS: Array<{ value: LoanStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: LOAN_STATUS_CONFIG.PENDING.label },
  { value: "BORROWED", label: LOAN_STATUS_CONFIG.BORROWED.label },
  { value: "OVERDUE", label: LOAN_STATUS_CONFIG.OVERDUE.label },
  { value: "RETURNED", label: LOAN_STATUS_CONFIG.RETURNED.label },
  { value: "CANCELLED", label: LOAN_STATUS_CONFIG.CANCELLED.label },
  { value: "EXPIRED", label: LOAN_STATUS_CONFIG.EXPIRED.label },
];

export interface BorrowerLoanToolbarProps {
  selectedStatus: LoanStatus | "ALL";
  onStatusChange: (status: LoanStatus | "ALL") => void;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  onSearchClear: () => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  total: number;
}

export function BorrowerLoanToolbar({
  selectedStatus,
  onStatusChange,
  searchDraft,
  onSearchDraftChange,
  onSearchSubmit,
  onSearchClear,
  onResetFilters,
  onRefresh,
  isLoading,
  total,
}: BorrowerLoanToolbarProps) {
  const hasActiveFilter = selectedStatus !== "ALL" || searchDraft.trim() !== "";

  return (
    <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs space-y-4">
      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onStatusChange(tab.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                isActive
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-stone-100">
        <form
          onSubmit={onSearchSubmit}
          className="relative flex-1 max-w-md flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => onSearchDraftChange(e.target.value)}
              placeholder="Tìm theo mã phiếu mượn (UUID)..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#B8860B] transition-colors"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={onSearchClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#F5B82E] hover:bg-[#e5a922] text-[#1A1A1A] text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-stone-500">
            Tổng cộng:{" "}
            <span className="font-semibold text-stone-900">{total}</span> phiếu mượn
          </span>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-50 transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
