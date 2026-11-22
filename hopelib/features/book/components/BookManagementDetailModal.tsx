"use client";

import React from "react";
import {
  X,
  BookOpen,
  Loader2,
  Edit3,
  Calendar,
  Building,
  Tag,
  User,
  Barcode,
  Image as ImageIcon,
} from "lucide-react";
import { BookEntity } from "../types/book.types";
import { getBookCoverUrl } from "../utils/bookImage.helper";
import { BookPdfSection } from "./BookPdfSection";
import { cn } from "@/lib/utils";

export interface BookManagementDetailModalProps {
  isOpen: boolean;
  book: BookEntity | null;
  isLoading: boolean;
  authorMap: Record<string, string>;
  categoryMap: Record<string, string>;
  onClose: () => void;
  onEdit: (book: BookEntity) => void;
  canUpdate?: boolean;
}

export function BookManagementDetailModal({
  isOpen,
  book,
  isLoading,
  authorMap,
  categoryMap,
  onClose,
  onEdit,
  canUpdate = true,
}: BookManagementDetailModalProps) {
  if (!isOpen) return null;

  const authorName =
    book?.author?.name ||
    (book?.authorId ? authorMap[book.authorId] : null) ||
    "Chưa xác định";

  const categoryName =
    book?.category?.name ||
    (book?.categoryId ? categoryMap[book.categoryId] : null) ||
    "Chưa phân loại";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Chi tiết Cuốn sách
              </h2>
              <p className="text-xs text-stone-500">
                Thông tin xuất bản, phân loại và các bản sao vật lý
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
              <span className="text-sm">Đang tải thông tin chi tiết sách...</span>
            </div>
          ) : !book ? (
            <div className="py-16 text-center text-stone-500 text-sm">
              Không thể tải thông tin sách.
            </div>
          ) : (
            <>
              {/* Top Section: Ảnh bìa + Thông tin chính */}
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Ảnh bìa */}
                <div className="w-36 h-48 sm:w-44 sm:h-60 rounded-2xl bg-stone-100 shrink-0 overflow-hidden border border-stone-200 shadow-xs flex items-center justify-center mx-auto sm:mx-0">
                  {getBookCoverUrl(book.bookUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getBookCoverUrl(book.bookUrl)!}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-stone-300" />
                  )}
                </div>

                {/* Chi tiết sách */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-md",
                        book.status === "ACTIVE" && "bg-emerald-100 text-emerald-800",
                        book.status === "INACTIVE" && "bg-stone-200 text-stone-700",
                        book.status === "ARCHIVED" && "bg-amber-100 text-amber-800"
                      )}
                    >
                      {book.status}
                    </span>
                    {book.isbn && (
                      <span className="text-xs font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        ISBN: {book.isbn}
                      </span>
                    )}
                    <span className="text-xs font-mono text-stone-400 bg-stone-50 px-2 py-0.5 rounded-md">
                      ID: {book.id.slice(0, 8)}...
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-stone-900 leading-snug">
                    {book.title}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>
                        Tác giả: <strong>{authorName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>
                        Thể loại: <strong>{categoryName}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>
                        NXB: <strong>{book.publisher || "Chưa rõ"}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                      <span>
                        Năm XB: <strong>{book.publicationYear || "Chưa rõ"}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Bản sao thống kê */}
                  <div className="flex items-center gap-4 pt-2">
                    <div className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                      <span className="text-stone-500">Khả dụng: </span>
                      <strong className="text-emerald-700 font-bold">{book.availableCopies}</strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                      <span className="text-stone-500">Tổng bản sao: </span>
                      <strong className="text-stone-900 font-bold">{book.totalCopies}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mô tả */}
              {book.description && (
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Mô tả nội dung
                  </h4>
                  <p className="text-sm text-stone-700 leading-relaxed bg-stone-50/70 p-4 rounded-xl border border-stone-200/70">
                    {book.description}
                  </p>
                </div>
              )}

              {/* File PDF nội dung sách */}
              <BookPdfSection
                bookId={book.id}
                bookTitle={book.title}
                pdfUrl={book.pdfUrl}
                variant="dashboard"
                showEmptyState
              />

              {/* Danh sách bản sao (Copies) */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Danh sách bản sao sách (Copies)
                    </h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {book.copies?.length || 0} bản
                    </span>
                  </div>
                </div>

                {(!book.copies || book.copies.length === 0) ? (
                  <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                    Chưa có bản sao vật lý nào cho cuốn sách này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto">
                    {book.copies.map((copy) => (
                      <div
                        key={copy.id || copy.barcode}
                        className="p-3 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-stone-900">
                            {copy.barcode}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Kệ: {copy.shelfLocation || "Chưa xếp kệ"}
                          </div>
                        </div>

                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase",
                            copy.status === "AVAILABLE" && "bg-emerald-100 text-emerald-800",
                            copy.status === "BORROWED" && "bg-amber-100 text-amber-800",
                            copy.status === "RESERVED" && "bg-sky-100 text-sky-800",
                            copy.status === "MAINTENANCE" && "bg-stone-200 text-stone-700",
                            copy.status === "DAMAGED" && "bg-orange-100 text-orange-800",
                            copy.status === "LOST" && "bg-rose-100 text-rose-800"
                          )}
                        >
                          {copy.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between">
          <div>
            {canUpdate && book && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(book);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa sách</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
