"use client";

import React, { useState } from "react";
import {
  X,
  BookOpen,
  Loader2,
  Save,
  ExternalLink,
  User,
  Image as ImageIcon,
} from "lucide-react";
import { AuthorDetail, UpdateAuthorDto } from "../types/author.types";

interface AuthorDetailContentProps {
  authorDetail: AuthorDetail;
  isUpdating: boolean;
  canUpdate?: boolean;
  onUpdate: (id: string, dto: UpdateAuthorDto) => Promise<boolean>;
}

function AuthorDetailContent({
  authorDetail,
  isUpdating,
  canUpdate = true,
  onUpdate,
}: AuthorDetailContentProps) {
  const [name, setName] = useState(authorDetail.name || "");
  const [biography, setBiography] = useState(authorDetail.biography || "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError("Tên tác giả không được để trống");
      return;
    }

    setValidationError(null);
    await onUpdate(authorDetail.id, {
      name: name.trim(),
      biography: biography.trim() || undefined,
    });
  };

  return (
    <>
      {/* Form Cập nhật thông tin Author */}
      <form onSubmit={handleSubmitUpdate} className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
            Thông tin tác giả
          </h3>
          <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
            ID: {authorDetail.id}
          </span>
        </div>

        {validationError && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {validationError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Tên tác giả <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canUpdate || isUpdating}
              placeholder="Nhập tên tác giả..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] disabled:bg-stone-100 disabled:text-stone-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Tiểu sử
            </label>
            <textarea
              rows={3}
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              disabled={!canUpdate || isUpdating}
              placeholder="Nhập tiểu sử, giới thiệu sự nghiệp của tác giả..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 focus:border-[#F5B82E] disabled:bg-stone-100 disabled:text-stone-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Nút Update trong UI Detail */}
        <div className="flex items-center justify-end pt-2">
          {canUpdate && (
            <button
              type="submit"
              disabled={isUpdating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Cập nhật tác giả</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Danh sách sách của tác giả (Chỉ xem, không update) */}
      <div className="space-y-4 pt-4 border-t border-stone-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
              Danh sách sách do tác giả sáng tác
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {authorDetail.books?.length || 0} sách
            </span>
          </div>

          <span className="text-xs text-stone-400 italic">
            * Danh sách sách chỉ để xem, không hỗ trợ chỉnh sửa tại đây
          </span>
        </div>

        {(!authorDetail.books || authorDetail.books.length === 0) ? (
          <div className="p-8 rounded-2xl bg-stone-50 border border-stone-200/80 text-center text-stone-500">
            <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-600">
              Chưa có cuốn sách nào được ghi nhận cho tác giả này
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              Sách được liên kết khi tạo hoặc chỉnh sửa thông tin sách trong thư viện.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {authorDetail.books.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-white hover:border-amber-200 transition-all group"
              >
                {/* bookUrl thumbnail / placeholder */}
                <div className="w-12 h-16 rounded-lg bg-stone-200 shrink-0 overflow-hidden flex items-center justify-center border border-stone-300/60 shadow-2xs">
                  {book.bookUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.bookUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-stone-400" />
                  )}
                </div>

                {/* Title & bookUrl info */}
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-semibold text-stone-900 truncate group-hover:text-amber-800 transition-colors"
                    title={book.title}
                  >
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-stone-400 truncate mt-1">
                    {book.bookUrl ? (
                      <span className="flex items-center gap-1 font-mono text-stone-500">
                        <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{book.bookUrl}</span>
                      </span>
                    ) : (
                      <span className="italic text-stone-400">Không có đường dẫn ảnh bìa</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export interface AuthorDetailModalProps {
  isOpen: boolean;
  authorDetail: AuthorDetail | null;
  isLoading: boolean;
  isUpdating: boolean;
  canUpdate?: boolean;
  onClose: () => void;
  onUpdate: (id: string, dto: UpdateAuthorDto) => Promise<boolean>;
}

export function AuthorDetailModal({
  isOpen,
  authorDetail,
  isLoading,
  isUpdating,
  canUpdate = true,
  onClose,
  onUpdate,
}: AuthorDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                Chi tiết Tác giả
              </h2>
              <p className="text-xs text-stone-500">
                Xem thông tin tác giả, cập nhật tiểu sử và danh sách tác phẩm sáng tác
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
              <span className="text-sm">Đang tải chi tiết tác giả và danh sách sách...</span>
            </div>
          ) : !authorDetail ? (
            <div className="py-16 text-center text-stone-500 text-sm">
              Không thể tải thông tin chi tiết tác giả.
            </div>
          ) : (
            <AuthorDetailContent
              key={authorDetail.id}
              authorDetail={authorDetail}
              isUpdating={isUpdating}
              canUpdate={canUpdate}
              onUpdate={onUpdate}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
