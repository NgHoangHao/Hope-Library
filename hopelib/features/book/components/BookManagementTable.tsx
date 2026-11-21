"use client";

import React from "react";
import { Eye, Edit3, Trash2, BookOpen, Loader2, Image as ImageIcon } from "lucide-react";
import { BookEntity } from "../types/book.types";
import { getBookCoverUrl } from "../utils/bookImage.helper";
import { cn } from "@/lib/utils";

export interface BookManagementTableProps {
  books: BookEntity[];
  isLoading: boolean;
  authorMap: Record<string, string>;
  categoryMap: Record<string, string>;
  onViewDetail: (id: string) => void;
  onEdit: (book: BookEntity) => void;
  onDelete: (book: BookEntity) => void;
  canRead?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function BookManagementTable({
  books,
  isLoading,
  authorMap,
  categoryMap,
  onViewDetail,
  onEdit,
  onDelete,
  canRead = true,
  canUpdate = true,
  canDelete = true,
}: BookManagementTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-20 flex flex-col items-center justify-center gap-3 text-stone-500 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium">Đang tải danh sách sách...</span>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Không tìm thấy cuốn sách nào
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          Không có kết quả phù hợp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-700 border-collapse">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/75 text-xs font-semibold text-stone-500 uppercase tracking-wider select-none">
              <th scope="col" className="py-3.5 px-6 w-16 text-center">
                STT
              </th>
              <th scope="col" className="py-3.5 px-6 min-w-[280px]">
                Sách & ISBN
              </th>
              <th scope="col" className="py-3.5 px-6 min-w-[180px]">
                Tác giả
              </th>
              <th scope="col" className="py-3.5 px-6 min-w-[160px]">
                Thể loại
              </th>
              <th scope="col" className="py-3.5 px-6 w-32 text-center">
                Bản sao
              </th>
              <th scope="col" className="py-3.5 px-6 w-32 text-center">
                Trạng thái
              </th>
              <th scope="col" className="py-3.5 px-6 w-48 text-right">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {books.map((book, index) => {
              const authorName =
                book.author?.name ||
                (book.authorId ? authorMap[book.authorId] : null) ||
                "Chưa xác định";

              const categoryName =
                book.category?.name ||
                (book.categoryId ? categoryMap[book.categoryId] : null) ||
                "Chưa phân loại";

              return (
                <tr
                  key={book.id}
                  className="hover:bg-stone-50/80 transition-colors group"
                >
                  {/* STT */}
                  <td className="py-4 px-6 text-center font-mono text-xs text-stone-400">
                    {index + 1}
                  </td>

                  {/* Sách & ISBN */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {/* Ảnh bìa */}
                      <div className="w-10 h-14 rounded-lg bg-stone-100 shrink-0 overflow-hidden flex items-center justify-center border border-stone-200 shadow-2xs">
                        {getBookCoverUrl(book.bookUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getBookCoverUrl(book.bookUrl)!}
                            alt={book.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-stone-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <span
                          className="font-semibold text-stone-900 group-hover:text-amber-700 transition-colors block truncate max-w-xs"
                          title={book.title}
                        >
                          {book.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {book.isbn ? (
                            <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                              ISBN: {book.isbn}
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              Chưa có ISBN
                            </span>
                          )}
                          {book.publicationYear && (
                            <span className="text-[11px] text-stone-400">
                              • {book.publicationYear}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tác giả */}
                  <td className="py-4 px-6">
                    <span className="text-stone-800 font-medium text-xs">
                      {authorName}
                    </span>
                  </td>

                  {/* Thể loại */}
                  <td className="py-4 px-6">
                    <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/50">
                      {categoryName}
                    </span>
                  </td>

                  {/* Bản sao */}
                  <td className="py-4 px-6 text-center">
                    <span
                      className={cn(
                        "text-xs font-mono font-bold px-2.5 py-1 rounded-full",
                        book.availableCopies > 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      )}
                    >
                      {book.availableCopies}/{book.totalCopies}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-4 px-6 text-center">
                    <span
                      className={cn(
                        "text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md",
                        book.status === "ACTIVE" && "bg-emerald-100 text-emerald-800",
                        book.status === "INACTIVE" && "bg-stone-200 text-stone-700",
                        book.status === "ARCHIVED" && "bg-amber-100 text-amber-800"
                      )}
                    >
                      {book.status}
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Nút Xem chi tiết */}
                      <button
                        onClick={() => onViewDetail(book.id)}
                        disabled={!canRead}
                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-40"
                        title="Xem chi tiết sách"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Nút Sửa */}
                      {canUpdate && (
                        <button
                          onClick={() => onEdit(book)}
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Chỉnh sửa thông tin sách"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Nút Xóa */}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(book)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa sách"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
