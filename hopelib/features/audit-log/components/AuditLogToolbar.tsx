"use client";

import React from "react";
import { Search, X, RotateCcw, Filter } from "lucide-react";
import { isImeKeyEvent } from "@/lib/ime";

export interface AuditLogToolbarProps {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  actionFilter: string;
  onActionFilterChange: (action: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

const ACTION_OPTIONS = [
  { label: "Tất cả thao tác", value: "ALL" },
  { label: "POST (Tạo mới)", value: "POST" },
  { label: "PUT (Cập nhật)", value: "PUT" },
  { label: "DELETE (Xóa)", value: "DELETE" },
];

export function AuditLogToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearchSubmit,
  onSearchClear,
  actionFilter,
  onActionFilterChange,
  hasActiveFilters,
  onResetFilters,
}: AuditLogToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isImeKeyEvent(e.nativeEvent)) return;
    if (e.key === "Enter") {
      onSearchSubmit();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-3.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Khung tìm kiếm theo tên, username, email */}
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={searchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm theo tên người dùng, username, email..."
            className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm bg-stone-50/50 hover:bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
          />

          <div className="absolute inset-y-0 right-1 flex items-center gap-1 pr-1.5">
            {searchDraft && (
              <button
                type="button"
                onClick={onSearchClear}
                aria-label="Xóa tìm kiếm"
                title="Xóa tìm kiếm"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
              >
                <X aria-hidden="true" className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onSearchSubmit}
              className="px-2.5 py-1.5 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Lọc theo loại thao tác CRUD */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Thao tác:</span>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => onActionFilterChange(e.target.value)}
            className="text-xs font-semibold bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] cursor-pointer"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Đặt lại bộ lọc"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200/80 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs nhanh thao tác */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-stone-100 text-xs">
        <span className="text-[11px] font-medium text-stone-400 uppercase tracking-wider shrink-0 mr-1">
          Lọc nhanh:
        </span>
        {ACTION_OPTIONS.map((opt) => {
          const isActive = actionFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onActionFilterChange(opt.value)}
              className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? "bg-amber-100 text-amber-900 font-bold border border-amber-300"
                  : "bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/60"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
