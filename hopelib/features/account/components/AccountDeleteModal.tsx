"use client";

import React from "react";
import { AlertTriangle, Loader2, X, User } from "lucide-react";
import { AccountUser } from "../types/account.types";

export interface AccountDeleteModalProps {
  isOpen: boolean;
  user: AccountUser | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

export function AccountDeleteModal({
  isOpen,
  user,
  isDeleting,
  onClose,
  onConfirm,
}: AccountDeleteModalProps) {
  if (!isOpen || !user) return null;

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
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-stone-900 mt-1">
            Xác nhận xóa tài khoản?
          </h3>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản{" "}
            <span className="font-semibold text-stone-900">
              &quot;{user.fullName || user.username}&quot; (@{user.username})
            </span>{" "}
            khỏi hệ thống?
          </p>

          {/* Hộp cảnh báo dữ liệu liên kết */}
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>Lưu ý ràng buộc dữ liệu:</span>
            </div>
            <p className="text-amber-800">
              Nếu người dùng này đang có phiếu mượn (đang mượn hoặc đã trả), khoản phạt hoặc nhật ký kiểm toán trong hệ thống, thao tác xóa sẽ bị từ chối để đảm bảo toàn vẹn dữ liệu.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <span>Xác nhận xóa</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
