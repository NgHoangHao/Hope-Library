"use client";

import React from "react";
import { Search, X, RotateCcw, Filter } from "lucide-react";
import { Category } from "@/features/category";
import { Author } from "@/features/author";

interface BorrowerBookCatalogToolbarProps {
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  onSearchClear: () => void;
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  categories: Category[];
  selectedAuthorId: string;
  onAuthorChange: (authorId: string) => void;
  authors: Author[];
  onResetFilters: () => void;
  total: number;
}

export function BorrowerBookCatalogToolbar({
  searchDraft,
  onSearchDraftChange,
  onSearchSubmit,
  onSearchClear,
  selectedCategoryId,
  onCategoryChange,
  categories,
  selectedAuthorId,
  onAuthorChange,
  authors,
  onResetFilters,
  total,
}: BorrowerBookCatalogToolbarProps) {
  const hasActiveFilters =
    Boolean(searchDraft.trim()) ||
    (Boolean(selectedCategoryId) && selectedCategoryId !== "ALL") ||
    (Boolean(selectedAuthorId) && selectedAuthorId !== "ALL");

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/5 shadow-xs mb-8 space-y-4">
      {/* Top Search Bar & Submit */}
      <form
        onSubmit={onSearchSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3"
      >
        <div className="relative flex-1 flex items-center bg-[#FAF8F5] rounded-xl border border-neutral-200/80 px-3.5 py-2.5 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2.5" />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            placeholder="Tìm theo tên sách hoặc mã ISBN..."
            className="w-full bg-transparent outline-none text-[#1A1A1A] placeholder-neutral-400 text-sm"
          />
          {searchDraft && (
            <button
              type="button"
              onClick={onSearchClear}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="bg-[#F5B82E] hover:bg-[#EAA91D] text-[#1A1A1A] font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 active:scale-[0.98]"
        >
          Tìm kiếm
        </button>
      </form>

      {/* Filter Selects & Stats Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-3 border-t border-neutral-100">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-[#B8860B]" />
            <span>Lọc theo:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="text-xs font-medium bg-[#FAF8F5] border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer max-w-[200px]"
          >
            <option value="ALL">Tất cả thể loại</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Author Filter */}
          <select
            value={selectedAuthorId}
            onChange={(e) => onAuthorChange(e.target.value)}
            className="text-xs font-medium bg-[#FAF8F5] border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer max-w-[200px]"
          >
            <option value="ALL">Tất cả tác giả</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-amber-800 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        {/* Total Results Count */}
        <div className="text-xs text-neutral-500">
          Tìm thấy <span className="font-bold text-neutral-900">{total}</span> cuốn sách
        </div>
      </div>
    </div>
  );
}
