"use client";

import React from "react";
import { Search, Plus, Filter, RotateCcw, User, Bookmark, X } from "lucide-react";
import { isImeKeyEvent } from "@/lib/ime";
import { Author } from "@/features/author";
import { Category } from "@/features/category";

export interface BookFilterToolbarProps {
  // Search
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;

  // Filter Author
  authors: Author[];
  selectedAuthorId: string;
  onAuthorChange: (authorId: string) => void;

  // Filter Category
  categories: Category[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;

  // Reset
  onResetFilters: () => void;
  hasActiveFilters: boolean;

  // Action
  onOpenCreate: () => void;
  canCreate?: boolean;
}

export function BookFilterToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearchSubmit,
  onSearchClear,
  authors,
  selectedAuthorId,
  onAuthorChange,
  categories,
  selectedCategoryId,
  onCategoryChange,
  onResetFilters,
  hasActiveFilters,
  onOpenCreate,
  canCreate = true,
}: BookFilterToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isImeKeyEvent(e.nativeEvent)) return;
    if (e.key === "Enter") {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-3.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Box with explicit Search Button */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => onSearchDraftChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tên sách để tìm kiếm (Enter hoặc bấm nút Tìm)..."
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

          {/* Button Search - Chỉ bấm mới gọi API */}
          <button
            type="button"
            onClick={onSearchSubmit}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Bấm để tìm kiếm sách"
          >
            <Search className="w-4 h-4" />
            <span>Tìm kiếm</span>
          </button>
        </div>

        {/* Action Button: Thêm sách mới */}
        {canCreate && (
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sách mới</span>
          </button>
        )}
      </div>

      {/* Row Filter Comboboxes: Tác giả & Thể loại (Chọn là gọi API ngay) */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Bộ lọc:</span>
        </div>

        {/* Combobox Lọc theo Tác giả */}
        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
          <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="text-xs font-medium text-stone-500 shrink-0">Tác giả:</span>
          <select
            value={selectedAuthorId}
            onChange={(e) => onAuthorChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL">Tất cả tác giả (ALL)</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>
        </div>

        {/* Combobox Lọc theo Thể loại */}
        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
          <Bookmark className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="text-xs font-medium text-stone-500 shrink-0">Thể loại:</span>
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer pr-1"
          >
            <option value="ALL">Tất cả thể loại (ALL)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nút Đặt lại bộ lọc */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-800 px-2 py-1.5 rounded-lg hover:bg-stone-100 transition-colors ml-auto sm:ml-0 cursor-pointer"
            title="Đặt lại toàn bộ bộ lọc và tìm kiếm"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>
    </div>
  );
}
