"use client";

import React from "react";
import { AlertTriangle, Loader2, X, XCircle } from "lucide-react";
import { useLayerDismissal, useFocusTrap } from "@/hooks";

export interface BorrowerLoanCancelModalProps {
  loanId: string | null;
  isCancelling: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function BorrowerLoanCancelModal({
  loanId,
  isCancelling,
  onClose,
  onConfirm,
}: BorrowerLoanCancelModalProps) {
  const isOpen = Boolean(loanId);

  useLayerDismissal({
    isOpen,
    onDismiss: onClose,
    disabled: isCancelling,
  });

  const dialogRef = useFocusTrap<HTMLDivElement>({
    isActive: isOpen,
  });

  if (!loanId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-loan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs ui-backdrop-enter"
        onClick={() => {
          if (!isCancelling) onClose();
        }}
      />

      {/* Modal Card */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden ui-dialog-enter"
      >
        <div className="p-6">
          <div className="flex items-center justify-between pb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle aria-hidden="true" className="w-6 h-6" />
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isCancelling}
              aria-label="Đóng hộp thoại xác nhận hủy"
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X aria-hidden="true" className="w-5 h-5" />
            </button>
          </div>

          <h3
            id="cancel-loan-modal-title"
            className="text-lg font-bold text-stone-900 mt-1"
          >
            Xác nhận hủy đặt mượn sách?
          </h3>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Bạn có chắc chắn muốn hủy phiếu đặt mượn{" "}
            <span className="font-mono font-semibold text-stone-900">
              #{loanId.slice(0, 8).toUpperCase()}
            </span>
            ? Các bản sao sách đang giữ chỗ sẽ được hoàn trả lại kho thư viện để độc giả khác có thể mượn.
          </p>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isCancelling}
              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Giữ lại phiếu
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isCancelling}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isCancelling ? (
                <>
                  <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
                  <span>Đang hủy...</span>
                </>
              ) : (
                <>
                  <XCircle aria-hidden="true" className="w-4 h-4" />
                  <span>Xác nhận hủy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

BorrowerLoanCancelModal.displayName = "BorrowerLoanCancelModal";
