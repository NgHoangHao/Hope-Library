"use client";

import React from "react";
import { Search, Plus, ChevronsDown, ChevronsUp, X } from "lucide-react";
import { isImeKeyEvent } from "@/lib/ime";

export interface NavigationManagementToolbarProps {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  activeSearch: string;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenCreate: () => void;
  canCreate?: boolean;
}

export function NavigationManagementToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearchSubmit,
  onSearchClear,
  activeSearch,
  onExpandAll,
  onCollapseAll,
  onOpenCreate,
  canCreate = true,
}: NavigationManagementToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isImeKeyEvent(e.nativeEvent)) return;
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Ô tìm kiếm + Nút bấm tìm kiếm (chỉ bấm mới gọi tìm kiếm trên FE) */}
      <div className="flex items-center gap-2 flex-1 max-w-lg">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm theo tên menu hoặc đường dẫn path..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm border border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] transition-all"
          />
          {searchDraft && (
            <button
              type="button"
              onClick={onSearchClear}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 cursor-pointer"
              title="Xóa từ khóa tìm kiếm"
            >
              <X aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Nút Tìm kiếm - Chỉ bấm mới thực hiện */}
        <button
          type="button"
          onClick={onSearchSubmit}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
          title="Bấm để tìm kiếm menu"
        >
          <Search className="w-4 h-4" />
          <span>Tìm kiếm</span>
        </button>
      </div>

      {/* Thông báo từ khóa tìm kiếm đang áp dụng */}
      {activeSearch && (
        <div className="flex items-center gap-2 pt-1 text-xs text-stone-600">
          <span className="font-medium text-stone-500">Đang lọc theo:</span>
          <span className="font-mono font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
            &quot;{activeSearch}&quot;
          </span>
          <button
            type="button"
            onClick={onSearchClear}
            className="text-stone-400 hover:text-stone-700 underline text-[11px] cursor-pointer ml-1"
          >
            Hủy lọc
          </button>
        </div>
      )}

      {/* Action buttons: Expand/Collapse All + Thêm menu mới */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={onExpandAll}
            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
            title="Mở rộng tất cả các cấp menu"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mở rộng</span>
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
            title="Thu gọn tất cả các cấp menu"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Thu gọn</span>
          </button>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm menu</span>
          </button>
        )}
      </div>
    </div>
  );
}
