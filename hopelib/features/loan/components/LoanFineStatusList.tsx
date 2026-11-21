"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { FineStatus, LoanFineResponseData } from "../types/loan.types";
import {
  FINE_STATUS_CONFIG,
  formatCurrencyVnd,
  formatLoanDateTime,
} from "../utils/loanDisplay";

const FINE_STATUS_OPTIONS: FineStatus[] = ["UNPAID", "PAID", "WAIVED"];

export interface LoanFineStatusListProps {
  fines?: LoanFineResponseData[];
  canUpdateFine: boolean;
  updatingFineId?: string | null;
  onUpdateFineStatus?: (fineId: string, status: FineStatus) => Promise<boolean>;
}

export function LoanFineStatusList({
  fines,
  canUpdateFine,
  updatingFineId,
  onUpdateFineStatus,
}: LoanFineStatusListProps) {
  if (!fines || fines.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-3 flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4" />
        <span>Khoản phạt liên quan ({fines.length})</span>
      </h3>

      <div className="space-y-2.5">
        {fines.map((fine) => {
          const normalizedStatus = (fine.status?.toUpperCase() ||
            "UNPAID") as FineStatus;
          const statusCfg =
            FINE_STATUS_CONFIG[normalizedStatus] ?? FINE_STATUS_CONFIG.UNPAID;
          const isUnpaid = normalizedStatus === "UNPAID";
          const isUpdatingThis = updatingFineId === fine.id;

          return (
            <div
              key={fine.id}
              className={`p-3.5 rounded-xl border text-xs transition-colors ${
                isUnpaid
                  ? "bg-red-50/70 border-red-200"
                  : "bg-stone-50/80 border-stone-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-stone-900">
                      {fine.reason || "Phí phạt mượn trả"}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.badgeClass}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}
                      />
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-stone-500">
                    {fine.paidAt && (
                      <span className="text-emerald-700 font-medium">
                        Thanh toán lúc: {formatLoanDateTime(fine.paidAt)}
                      </span>
                    )}
                    {fine.createdAt && (
                      <span>Tạo lúc: {formatLoanDateTime(fine.createdAt)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <span
                    className={`font-extrabold text-sm tabular-nums ${
                      isUnpaid ? "text-red-700" : "text-stone-800"
                    }`}
                  >
                    {formatCurrencyVnd(fine.amount)}
                  </span>

                  {canUpdateFine && onUpdateFineStatus && (
                    <div className="flex items-center gap-1.5">
                      {isUnpaid && (
                        <button
                          type="button"
                          disabled={Boolean(updatingFineId)}
                          onClick={() => onUpdateFineStatus(fine.id, "PAID")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                          title="Xác nhận đã thu tiền phạt"
                        >
                          {isUpdatingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          <span>Đã trả</span>
                        </button>
                      )}

                      <select
                        aria-label="Đổi trạng thái khoản phạt"
                        value={normalizedStatus}
                        disabled={Boolean(updatingFineId)}
                        onChange={(e) => {
                          const nextStatus = e.target.value as FineStatus;
                          if (nextStatus !== normalizedStatus) {
                            void onUpdateFineStatus(fine.id, nextStatus);
                          }
                        }}
                        className="px-2.5 py-1.5 text-[11px] font-semibold bg-white border border-stone-300 rounded-lg text-stone-800 focus:outline-none focus:border-[#B8860B] disabled:opacity-50 cursor-pointer"
                      >
                        {FINE_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {FINE_STATUS_CONFIG[opt].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
