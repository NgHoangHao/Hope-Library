"use client";

import React from "react";
import { AlertTriangle, Wallet } from "lucide-react";
import { formatCurrencyVnd } from "../utils/loanDisplay";

export interface BorrowerUnpaidFineBannerProps {
  totalUnpaidFineAmount: number;
  unpaidFineLoansCount: number;
}

export function BorrowerUnpaidFineBanner({
  totalUnpaidFineAmount,
  unpaidFineLoansCount,
}: BorrowerUnpaidFineBannerProps) {
  if (totalUnpaidFineAmount <= 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-6 rounded-2xl border-2 border-red-400 bg-red-50/90 p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-red-900">
                Bạn có khoản tiền phạt chưa thanh toán
              </h2>
              {unpaidFineLoansCount > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white">
                  {unpaidFineLoansCount} phiếu mượn
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-red-800/90 mt-1">
              Vui lòng thanh toán khoản phạt tại quầy thư viện để tiếp tục đặt
              giữ chỗ hoặc mượn sách mới.
            </p>
          </div>
        </div>

        <div className="sm:text-right shrink-0 bg-white/90 border border-red-200 rounded-xl px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600 flex items-center sm:justify-end gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            <span>Tổng số tiền cần trả</span>
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-red-700 mt-0.5 tabular-nums">
            {formatCurrencyVnd(totalUnpaidFineAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
