"use client";

import React from "react";
import { BookOpen, SearchX } from "lucide-react";
import { BookEntity } from "../types/book.types";
import { BorrowerBookCard } from "./BorrowerBookCard";

interface BorrowerBookCatalogGridProps {
  books: BookEntity[];
  isLoading: boolean;
  onSelectBook: (book: BookEntity) => void;
  onResetFilters?: () => void;
  searchQuery?: string;
  authorMap?: Record<string, string>;
  categoryMap?: Record<string, string>;
  cartCountByBookId?: Record<string, number>;
}

export function BorrowerBookCatalogGrid({
  books,
  isLoading,
  onSelectBook,
  onResetFilters,
  searchQuery,
  authorMap,
  categoryMap,
  cartCountByBookId,
}: BorrowerBookCatalogGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-3.5 border border-black/5 animate-pulse flex flex-col"
          >
            <div className="w-full aspect-[1/1.22] rounded-xl bg-neutral-200/80 mb-3" />
            <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2" />
            <div className="h-5 bg-neutral-200 rounded w-4/5 mb-2" />
            <div className="h-3 bg-neutral-200 rounded w-1/2 mt-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-black/5 shadow-xs my-6">
        <div className="w-14 h-14 rounded-full bg-amber-500/15 text-[#B8860B] flex items-center justify-center mx-auto mb-3.5">
          {searchQuery ? (
            <SearchX className="w-7 h-7" />
          ) : (
            <BookOpen className="w-7 h-7" />
          )}
        </div>
        <h3 className="text-base sm:text-lg font-bold text-neutral-800">
          {searchQuery
            ? `Không tìm thấy cuốn sách nào khớp với "${searchQuery}"`
            : "Chưa có sách nào trong mục này"}
        </h3>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 max-w-md mx-auto">
          Vui lòng thử tìm kiếm bằng từ khóa khác hoặc điều chỉnh lại các tiêu chí bộ lọc.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="mt-5 px-6 py-2.5 rounded-xl bg-[#F5B82E] text-[#1A1A1A] text-xs font-semibold hover:bg-[#EAA91D] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Xem toàn bộ sách
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {books.map((book) => (
        <BorrowerBookCard
          key={book.id}
          book={book}
          onSelect={onSelectBook}
          authorMap={authorMap}
          categoryMap={categoryMap}
          inCartCount={cartCountByBookId?.[book.id] ?? 0}
        />
      ))}
    </div>
  );
}
