"use client";

import React from "react";
import { Search, Filter, RotateCcw, X } from "lucide-react";
import { isImeKeyEvent } from "@/lib/ime";

export interface BorrowerSummaryToolbarProps {
  searchDraft: string;
  statusFilter: string;
  hasActiveFilters: boolean;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  onStatusFilterChange: (status: string) => void;
  onResetFilters: () => void;
}

export function BorrowerSummaryToolbar({
  searchDraft,
  statusFilter,
  hasActiveFilters,
  onSearchDraftChange,
  onSearchSubmit,
  onSearchClear,
  onStatusFilterChange,
  onResetFilters,
}: BorrowerSummaryToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isImeKeyEvent(e.nativeEvent)) return;
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
      {/* Khối tìm kiếm: Chỉ gọi API khi bấm nút Tìm kiếm */}
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập mã độc giả (VD: A-0001) rồi bấm Tìm kiếm..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm border border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
          />
          {searchDraft && (
            <button
              type="button"
              onClick={onSearchClear}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              title="Xóa từ khóa tìm kiếm"
            >
              <X aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onSearchSubmit}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
          title="Bấm để tìm kiếm độc giả"
        >
          <Search className="w-4 h-4" />
          <span>Tìm kiếm</span>
        </button>
      </div>

      {/* Bộ lọc trạng thái tài khoản (userStatus): Chọn là gọi API ngay */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="text-xs font-medium text-stone-500 shrink-0">
            Trạng thái:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-semibold text-stone-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL">Tất cả trạng thái (ALL)</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
            <option value="LOCKED">Đã khóa (LOCKED)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 px-3 py-2 rounded-xl border border-stone-200/80 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Đặt lại bộ lọc và từ khóa tìm kiếm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>
    </div>
  );
}
