"use client";

import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { LoanResponseData } from "../types/loan.types";
import { LOAN_STATUS_CONFIG } from "../utils/loanDisplay";

export interface LoanDeleteModalProps {
  isOpen: boolean;
  loan: LoanResponseData | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

export function LoanDeleteModal({
  isOpen,
  loan,
  isDeleting,
  onClose,
  onConfirm,
}: LoanDeleteModalProps) {
  if (!isOpen || !loan) return null;

  const statusCfg =
    LOAN_STATUS_CONFIG[loan.status] || LOAN_STATUS_CONFIG.BORROWED;
  const borrowerName =
    loan.user?.fullName || loan.user?.username || loan.userId;

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
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-stone-900 mt-1">
            Xác nhận xóa phiếu mượn?
          </h3>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Bạn có chắc chắn muốn xóa phiếu mượn{" "}
            <span className="font-mono font-semibold text-stone-900">
              #{loan.id.slice(0, 8)}...
            </span>{" "}
            của độc giả{" "}
            <span className="font-semibold text-stone-900">{borrowerName}</span>{" "}
            (trạng thái{" "}
            <span className="font-semibold text-stone-800">
              {statusCfg.label}
            </span>
            )?
          </p>

          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-800 leading-relaxed">
            <strong>Lưu ý:</strong> Hành động này sẽ xóa vĩnh viễn phiếu mượn
            cùng toàn bộ mục sách mượn (loan items) và khoản phạt liên quan, đồng
            thời tự động khôi phục trạng thái <strong>AVAILABLE</strong> cho các
            bản sao sách đang được mượn.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
