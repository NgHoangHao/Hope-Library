"use client";

import React from "react";
import { isImeKeyEvent } from "@/lib/ime";
import {
  Search,
  BookOpen,
  Barcode,
  MapPin,
  Check,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { BookEntity, BookCopyItem, getBookCoverUrl } from "@/features/book";
import { SelectedBookCopyForLoan } from "../types/loan.types";

export interface CreateLoanBookSelectorProps {
  books: BookEntity[];
  bookPage: number;
  bookTotalPages: number;
  bookTotal: number;
  isLoadingBooks: boolean;
  bookSearchDraft: string;
  expandedBook: BookEntity | null;
  isLoadingCopies: boolean;
  selectedItems: SelectedBookCopyForLoan[];
  manualBookCopyId: string;
  onBookSearchDraftChange: (val: string) => void;
  onBookSearchSubmit: () => void;
  onBookSearchClear: () => void;
  onBookPageChange: (page: number) => void;
  onInspectBookCopies: (book: BookEntity) => void;
  onCloseExpandedBook: () => void;
  onSelectBookCopy: (book: BookEntity, copy: BookCopyItem) => void;
  onManualBookCopyIdChange: (val: string) => void;
  onAddManualBookCopy: () => void;
}

export function CreateLoanBookSelector({
  books,
  bookPage,
  bookTotalPages,
  bookTotal,
  isLoadingBooks,
  bookSearchDraft,
  expandedBook,
  isLoadingCopies,
  selectedItems,
  manualBookCopyId,
  onBookSearchDraftChange,
  onBookSearchSubmit,
  onBookSearchClear,
  onBookPageChange,
  onInspectBookCopies,
  onCloseExpandedBook,
  onSelectBookCopy,
  onManualBookCopyIdChange,
  onAddManualBookCopy,
}: CreateLoanBookSelectorProps) {
  const selectedCopyIdSet = new Set(selectedItems.map((i) => i.bookCopyId));

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5">
      <div>
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#B8860B]" />
          <span>Tìm & Chọn Bản Sao Sách Khả Dụng</span>
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Tìm kiếm đầu sách, bấm chọn sách để xem danh sách các bản sao (BookCopy) khả dụng trong kho
        </p>
      </div>

      {/* Thanh tìm kiếm sách */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={bookSearchDraft}
            onChange={(e) => onBookSearchDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (isImeKeyEvent(e.nativeEvent)) return;
              if (e.key === "Enter") {
                e.preventDefault();
                onBookSearchSubmit();
              }
            }}
            placeholder="Tìm theo tên đầu sách..."
            className="w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm border border-stone-200 bg-stone-50/50 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E]"
          />
          {bookSearchDraft && (
            <button
              type="button"
              onClick={onBookSearchClear}
              aria-label="Xóa từ khóa tìm kiếm sách"
              title="Xóa từ khóa tìm kiếm sách"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X aria-hidden="true" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onBookSearchSubmit}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Tìm sách</span>
        </button>
      </div>

      {/* Khối hiển thị bản sao của cuốn sách đang chọn */}
      {(isLoadingCopies || expandedBook) && (
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 min-w-0">
              {expandedBook && (() => {
                const expandedCoverUrl = getBookCoverUrl(expandedBook.bookUrl);
                return (
                  <div className="w-10 h-14 rounded-lg overflow-hidden border border-amber-200 bg-white flex items-center justify-center shrink-0">
                    {expandedCoverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={expandedCoverUrl}
                        alt={expandedBook.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <BookOpen className="w-4 h-4 text-amber-700/70" />
                    )}
                  </div>
                );
              })()}
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Danh sách bản sao vật lý (BookCopy)
                </span>
                <h3 className="text-sm font-bold text-stone-900 truncate">
                  {expandedBook?.title || "Đang tải bản sao..."}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseExpandedBook}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-amber-100/60 cursor-pointer shrink-0"
              title="Đóng danh sách bản sao"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isLoadingCopies ? (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>Đang tải các bản sao sách...</span>
            </div>
          ) : !expandedBook?.copies || expandedBook.copies.length === 0 ? (
            <p className="text-xs text-stone-500 italic py-2">
              Đầu sách này hiện chưa có bản sao vật lý nào trong kho.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {expandedBook.copies.map((copy) => {
                const isAvailable = copy.status?.toUpperCase() === "AVAILABLE";
                const isSelected = selectedCopyIdSet.has(copy.id);

                return (
                  <div
                    key={copy.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-300"
                        : isAvailable
                        ? "bg-white border-stone-200 hover:border-amber-300"
                        : "bg-stone-100/70 border-stone-200/60 opacity-60"
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-stone-900">
                        <Barcode className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">{copy.barcode}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-stone-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          Kệ: {copy.shelfLocation || "Khu vực chung"}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-stone-400 truncate">
                        ID: {copy.id}
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold shrink-0">
                        <Check className="w-3 h-3" />
                        <span>Đã chọn</span>
                      </span>
                    ) : isAvailable ? (
                      <button
                        type="button"
                        onClick={() => onSelectBookCopy(expandedBook, copy)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-[11px] font-semibold transition-all cursor-pointer shrink-0 active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Chọn mượn</span>
                      </button>
                    ) : (
                      <span className="px-2 py-1 rounded bg-stone-200 text-stone-600 text-[10px] font-semibold shrink-0">
                        {copy.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Danh sách đầu sách */}
      {isLoadingBooks ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-500">
          <Loader2 className="w-6 h-6 animate-spin text-[#F5B82E]" />
          <span className="text-xs">Đang tải danh mục sách...</span>
        </div>
      ) : books.length === 0 ? (
        <div className="py-10 text-center text-xs text-stone-500 border border-dashed border-stone-200 rounded-xl">
          Không tìm thấy đầu sách nào phù hợp.
        </div>
      ) : (
        <div className="space-y-2.5">
          {books.map((book) => {
            const isExpanded = expandedBook?.id === book.id;
            const hasAvailable = (book.availableCopies ?? 0) > 0;
            const coverUrl = getBookCoverUrl(book.bookUrl);

            return (
              <div
                key={book.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isExpanded
                    ? "border-[#F5B82E] bg-amber-50/30"
                    : "border-stone-200/80 hover:border-stone-300 bg-stone-50/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-16 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center shrink-0">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <BookOpen className="w-4 h-4 text-stone-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-stone-900 truncate">
                      {book.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-stone-500">
                      {book.isbn && (
                        <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/70">
                          ISBN: {book.isbn}
                        </span>
                      )}
                      <span
                        className={`font-semibold ${
                          hasAvailable ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        Khả dụng: {book.availableCopies}/{book.totalCopies} bản
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onInspectBookCopies(book)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 transition-colors cursor-pointer shrink-0"
                >
                  <Barcode className="w-3.5 h-3.5 text-[#B8860B]" />
                  <span>Chọn bản sao</span>
                </button>
              </div>
            );
          })}

          {/* Phân trang danh sách sách */}
          {bookTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-stone-500">
              <span>
                Trang {bookPage}/{bookTotalPages} ({bookTotal} đầu sách)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={bookPage <= 1}
                  onClick={() => onBookPageChange(bookPage - 1)}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={bookPage >= bookTotalPages}
                  onClick={() => onBookPageChange(bookPage + 1)}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nhập nhanh bằng bookCopyId UUID (tùy chọn) */}
      <div className="pt-3 border-t border-stone-100">
        <label className="block text-xs font-semibold text-stone-600 mb-1.5">
          Hoặc nhập trực tiếp mã định danh bản sao sách (bookCopyId UUID):
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={manualBookCopyId}
            onChange={(e) => onManualBookCopyIdChange(e.target.value)}
            onKeyDown={(e) => {
              if (isImeKeyEvent(e.nativeEvent)) return;
              if (e.key === "Enter") {
                e.preventDefault();
                onAddManualBookCopy();
              }
            }}
            placeholder="VD: d9b2d63d-a233-4f27-a048-ef36b69cf93f"
            className="flex-1 px-3.5 py-2 rounded-xl text-xs font-mono border border-stone-200 bg-stone-50/60 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50"
          />
          <button
            type="button"
            onClick={onAddManualBookCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ID</span>
          </button>
        </div>
      </div>
    </div>
  );
}
