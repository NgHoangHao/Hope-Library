"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import { usePermissions } from "@/features/auth";
import { LoanResponseData } from "../types/loan.types";
import {
  formatCurrencyVnd,
  formatLoanDate,
  formatLoanDateTime,
  getLoanUnpaidFineAmount,
  getLoanUnpaidFines,
  LOAN_STATUS_CONFIG,
} from "../utils/loanDisplay";

export interface BorrowerLoanListProps {
  loans: LoanResponseData[];
  isLoading: boolean;
  cancellingId: string | null;
  onOpenDetail: (loanId: string) => void;
  onCancelLoan: (loanId: string) => void;
  onResetFilters: () => void;
  hasActiveFilter: boolean;
}

export function BorrowerLoanList({
  loans,
  isLoading,
  cancellingId,
  onOpenDetail,
  onCancelLoan,
  onResetFilters,
  hasActiveFilter,
}: BorrowerLoanListProps) {
  const { hasPermission } = usePermissions();
  const canViewDetail = hasPermission("LOAN_READ");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white border border-stone-200/80 rounded-2xl p-5 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-44 bg-stone-200 rounded" />
              <div className="h-6 w-24 bg-stone-200 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="h-4 w-36 bg-stone-100 rounded" />
              <div className="h-4 w-36 bg-stone-100 rounded" />
              <div className="h-4 w-36 bg-stone-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="bg-white border border-stone-200/80 rounded-2xl p-10 sm:p-14 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F5B82E]/15 text-[#B8860B] flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-900 mb-1">
          {hasActiveFilter
            ? "Không tìm thấy phiếu mượn phù hợp"
            : "Bạn chưa có phiếu mượn nào"}
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-6">
          {hasActiveFilter
            ? "Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm để xem lại danh sách."
            : "Hãy khám phá tủ sách thư viện và đặt giữ chỗ những cuốn sách bạn yêu thích."}
        </p>
        {hasActiveFilter ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Xem tất cả phiếu mượn
          </button>
        ) : (
          <Link
            href="/books"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5B82E] hover:bg-[#e5a922] text-[#1A1A1A] text-xs font-semibold transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Khám phá Tủ sách</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loans.map((loan) => {
        const statusCfg = LOAN_STATUS_CONFIG[loan.status] ?? {
          label: loan.status,
          badgeClass: "bg-stone-100 text-stone-700 border-stone-200",
          dotClass: "bg-stone-400",
        };
        const isPending = loan.status?.toUpperCase() === "PENDING";
        const isOverdue = loan.status?.toUpperCase() === "OVERDUE";
        const isCancelling = cancellingId === loan.id;
        const unpaidFineAmount = getLoanUnpaidFineAmount(loan);
        const unpaidFines = getLoanUnpaidFines(loan);
        const hasUnpaidFine = unpaidFineAmount > 0;

        return (
          <div
            key={loan.id}
            className={`rounded-2xl p-5 transition-all ${
              hasUnpaidFine
                ? "bg-red-50/30 border-2 border-red-500 hover:border-red-600 shadow-sm ring-1 ring-red-200/70"
                : "bg-white border border-stone-200/80 hover:border-stone-300 shadow-2xs"
            }`}
          >
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                hasUnpaidFine ? "border-red-200/80" : "border-stone-100"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    hasUnpaidFine
                      ? "bg-red-100 text-red-600 border border-red-200"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {hasUnpaidFine ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Mã phiếu:
                    </span>
                    <span
                      className="text-xs sm:text-sm font-mono font-semibold text-stone-900 truncate"
                      title={loan.id}
                    >
                      #{loan.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Tạo lúc {formatLoanDateTime(loan.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
                {hasUnpaidFine && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-2xs"
                    title="Phiếu mượn có khoản tiền phạt chưa thanh toán"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Chưa trả phạt</span>
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                  {statusCfg.label}
                </span>
              </div>
            </div>

            {hasUnpaidFine && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200/90">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-red-800">
                      Khoản tiền phạt chưa thanh toán
                      {unpaidFines.length > 1
                        ? ` (${unpaidFines.length} khoản)`
                        : ""}
                    </p>
                    {unpaidFines[0]?.reason && (
                      <p className="text-[11px] text-red-700/90 mt-0.5 truncate">
                        {unpaidFines[0].reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="text-[11px] font-medium text-red-600 block">
                    Cần thanh toán
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-red-700 tabular-nums">
                    {formatCurrencyVnd(unpaidFineAmount)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 text-xs">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-stone-400 font-medium">Ngày mượn / đặt</p>
                  <p className="text-stone-800 font-semibold mt-0.5">
                    {formatLoanDate(loan.loanDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isOverdue ? "text-red-500" : "text-stone-400"
                  }`}
                />
                <div>
                  <p className="text-stone-400 font-medium">
                    {isPending ? "Hạn đến nhận sách" : "Hạn trả sách"}
                  </p>
                  <p
                    className={`font-semibold mt-0.5 ${
                      isOverdue ? "text-red-600" : "text-stone-800"
                    }`}
                  >
                    {isPending && loan.pickupDeadline
                      ? formatLoanDateTime(loan.pickupDeadline)
                      : formatLoanDate(loan.dueDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-stone-400 font-medium">Ngày trả thực tế</p>
                  <p className="text-stone-800 font-semibold mt-0.5">
                    {formatLoanDate(loan.returnDate)}
                  </p>
                </div>
              </div>
            </div>

            {loan.notes && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-600">
                <span className="font-semibold text-stone-700">Ghi chú: </span>
                {loan.notes}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              {isPending && (
                <button
                  type="button"
                  onClick={() => onCancelLoan(loan.id)}
                  disabled={isCancelling}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isCancelling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>{isCancelling ? "Đang hủy..." : "Hủy đặt mượn"}</span>
                </button>
              )}

              {canViewDetail && (
                <button
                  type="button"
                  onClick={() => onOpenDetail(loan.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A1A1A] hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem chi tiết</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
