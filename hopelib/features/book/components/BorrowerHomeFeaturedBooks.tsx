"use client";

import React from "react";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { BookEntity } from "../types/book.types";
import { BorrowerBookCard } from "./BorrowerBookCard";

interface BorrowerHomeFeaturedBooksProps {
  books: BookEntity[];
  isLoading: boolean;
  onSelectBook: (book: BookEntity) => void;
  onViewAll: () => void;
  authorMap?: Record<string, string>;
  categoryMap?: Record<string, string>;
}

export function BorrowerHomeFeaturedBooks({
  books,
  isLoading,
  onSelectBook,
  onViewAll,
  authorMap,
  categoryMap,
}: BorrowerHomeFeaturedBooksProps) {
  return (
    <section className="mb-14">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
            <span className="text-[#B8860B] font-semibold text-xs tracking-[0.2em] uppercase">
              TUYỂN CHỌN CHO BẠN
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1A1A]">
            Sách mượn trả nhiều nhất
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Các tác phẩm được độc giả yêu thích và đón đọc nhiều nhất tại thư viện
          </p>
        </div>

        <button
          onClick={onViewAll}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#B8860B] hover:text-[#9A7008] transition-colors cursor-pointer group shrink-0"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Skeletons Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
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
      ) : books.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-black/5 shadow-xs my-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/15 text-[#B8860B] flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-neutral-800">
            Chưa có sách nào trong danh sách mượn trả nhiều nhất
          </p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Hàng ngàn đầu sách phong phú khác đang chờ bạn khám phá trong kho tàng tri thức Hope Library.
          </p>
          <button
            onClick={onViewAll}
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F5B82E] text-[#1A1A1A] text-xs font-semibold hover:bg-[#EAA91D] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <span>Khám phá toàn bộ sách</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Books Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BorrowerBookCard
              key={book.id}
              book={book}
              onSelect={onSelectBook}
              authorMap={authorMap}
              categoryMap={categoryMap}
            />
          ))}
        </div>
      )}
    </section>
  );
}
