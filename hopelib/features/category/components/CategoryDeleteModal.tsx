"use client";

import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Category } from "../types/category.types";

export interface CategoryDeleteModalProps {
  isOpen: boolean;
  category: Category | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

export function CategoryDeleteModal({
  isOpen,
  category,
  isDeleting,
  onClose,
  onConfirm,
}: CategoryDeleteModalProps) {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden z-10 my-8">
        <div className="p-6">
          <div className="flex items-center justify-between pb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-stone-900 mt-1">
            Xác nhận xóa thể loại?
          </h3>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Bạn có chắc chắn muốn xóa thể loại{" "}
            <span className="font-semibold text-stone-900">
              &quot;{category.name}&quot;
            </span>{" "}
            khỏi hệ thống?
          </p>

          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-800 leading-relaxed">
            <strong>Lưu ý:</strong> Nếu thể loại này đang có sách liên kết, hệ thống sẽ từ chối xóa để đảm bảo toàn vẹn dữ liệu thư viện.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xác nhận xóa</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
