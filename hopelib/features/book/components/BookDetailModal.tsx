"use client";

import React, { useState } from "react";
import { X, Star, BookOpen, Check } from "lucide-react";
import { BookItem } from "../types/book.types";

interface BookDetailModalProps {
  book: BookItem | null;
  onClose: () => void;
}

export function BookDetailModal({ book, onClose }: BookDetailModalProps) {
  const [borrowSuccess, setBorrowSuccess] = useState(false);

  if (!book) return null;

  const handleBorrow = () => {
    setBorrowSuccess(true);
    setTimeout(() => {
      setBorrowSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-black/5 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Book Cover Visual */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <div
                className="relative w-[180px] sm:w-[210px] aspect-[1/1.18] rounded-2xl p-5 flex flex-col justify-between shadow-lg border border-black/10"
                style={{ backgroundColor: book.coverBg }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-black/25 to-transparent pointer-events-none rounded-l-2xl" />
                <span
                  className="text-[9px] font-semibold tracking-[0.2em] uppercase"
                  style={{ color: book.subtextColor }}
                >
                  HOPE LIBRARY
                </span>
                <h3
                  className="text-lg sm:text-xl font-bold tracking-tight leading-tight my-auto"
                  style={{ color: book.textColor }}
                >
                  {book.title}
                </h3>
                <span
                  className="text-xs font-medium"
                  style={{ color: book.subtextColor }}
                >
                  {book.author}
                </span>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 shadow-2xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    book.availableCopies > 0 ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <span className="text-xs font-medium text-neutral-700">
                  {book.availableCopies > 0
                    ? `Sẵn sàng (${book.availableCopies}/${book.totalCopies} bản)`
                    : "Đã hết sách tạm thời"}
                </span>
              </div>
            </div>

            {/* Info Column */}
            <div className="sm:col-span-7 flex flex-col">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B8860B] bg-[#F5B82E]/15 px-2.5 py-0.5 rounded-md">
                  {book.category}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-neutral-800 ml-auto">
                  <Star className="w-4 h-4 fill-[#F5B82E] text-[#F5B82E]" />
                  <span>{book.rating.toFixed(1)}</span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight leading-tight">
                {book.title}
              </h2>
              <p className="text-sm font-medium text-neutral-600 mt-1">
                Tác giả: <span className="text-neutral-900">{book.author}</span>
              </p>

              {/* Metadata pills */}
              <div className="grid grid-cols-2 gap-2 my-4 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-black/5">
                  <span className="text-neutral-400 block text-[11px]">Nhà xuất bản</span>
                  <span className="font-semibold text-neutral-800 line-clamp-1">
                    {book.publisher || "NXB Tổng Hợp"}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-black/5">
                  <span className="text-neutral-400 block text-[11px]">Năm xuất bản</span>
                  <span className="font-semibold text-neutral-800">
                    {book.publicationYear || 2022}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-black/5">
                  <span className="text-neutral-400 block text-[11px]">Mã ISBN</span>
                  <span className="font-semibold text-neutral-800 font-mono text-[11px]">
                    {book.isbn || "978-604-XXX"}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-black/5">
                  <span className="text-neutral-400 block text-[11px]">Vị trí lưu kho</span>
                  <span className="font-semibold text-neutral-800">Khu A - Tầng 2</span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-1">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">
                  Giới thiệu sách
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Borrow success feedback or Action buttons */}
              <div className="mt-6 pt-4 border-t border-neutral-200">
                {borrowSuccess ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-in fade-in">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Đã tạo yêu cầu mượn sách thành công! Vui lòng nhận sách tại quầy thủ thư.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBorrow}
                      disabled={book.availableCopies === 0}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-[#F5B82E] hover:bg-[#EAA91D] disabled:opacity-50 disabled:cursor-not-allowed text-[#1A1A1A] font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{book.availableCopies > 0 ? "Mượn sách này" : "Tạm thời hết sách"}</span>
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-700 font-medium text-sm border border-neutral-300 transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
