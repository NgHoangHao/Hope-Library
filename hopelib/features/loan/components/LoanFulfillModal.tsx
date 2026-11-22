"use client";

import React, { useEffect, useState } from "react";
import {
  Barcode,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  User,
  X,
} from "lucide-react";
import { getBookCoverUrl } from "@/features/book";
import {
  FulfillLoanInput,
  LoanDetailResponseData,
} from "../types/loan.types";
import { formatLoanDateTime } from "../utils/loanDisplay";

function getCalculatedDueDateDisplay(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface LoanFulfillModalProps {
  isOpen: boolean;
  isLoadingDetail: boolean;
  isFulfilling: boolean;
  maxLoanDays: number;
  isLoadingMaxLoanDays?: boolean;
  loan: LoanDetailResponseData | null;
  onClose: () => void;
  onConfirm: (loanId: string, input: FulfillLoanInput) => Promise<boolean>;
}

export function LoanFulfillModal({
  isOpen,
  isLoadingDetail,
  isFulfilling,
  maxLoanDays,
  isLoadingMaxLoanDays = false,
  loan,
  onClose,
  onConfirm,
}: LoanFulfillModalProps) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setNotes(loan?.notes ?? "");
  }, [isOpen, loan]);

  if (!isOpen) return null;

  const calculatedDueDateText = getCalculatedDueDateDisplay(maxLoanDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    await onConfirm(loan.id, {
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Xác nhận giao sách tại quầy
            </h2>
            {loan && (
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                {loan.id}
                {loan.user?.fullName ? ` • ${loan.user.fullName}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isFulfilling}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isLoadingDetail || !loan ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-stone-500">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            <p className="text-xs sm:text-sm">
              Đang tải thông tin phiếu đặt mượn...
            </p>
          </div>
        ) : (
          <form
            id="fulfill-loan-form"
            onSubmit={handleSubmit}
            className="p-6 overflow-y-auto space-y-5"
          >
            {/* Thông tin tóm tắt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-4 text-xs">
              <div>
                <span className="text-stone-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  Độc giả
                </span>
                <p className="font-semibold text-stone-900 mt-1">
                  {loan.user?.fullName || loan.user?.username || "Chưa rõ"}
                </p>
              </div>
              <div>
                <span className="text-stone-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Hạn đến lấy sách
                </span>
                <p className="font-semibold text-stone-900 mt-1">
                  {formatLoanDateTime(loan.pickupDeadline || loan.dueDate)}
                </p>
              </div>
            </div>

            {/* Danh sách sách sẽ giao */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#B8860B]" />
                <span>Sách giao cho độc giả ({loan.items?.length || 0})</span>
              </h3>
              <div className="space-y-2">
                {(loan.items ?? []).map((item) => {
                  const coverUrl = getBookCoverUrl(item.url);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/60"
                    >
                      <div className="w-10 h-14 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center shrink-0">
                        {coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={coverUrl}
                            alt={item.title || "Bìa sách"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <BookOpen className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 truncate">
                          {item.title || "Sách chưa cập nhật tên"}
                        </p>
                        <p className="text-xs text-stone-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <Barcode className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">
                            {item.bookCopy?.barcode || item.bookCopyId}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thông tin hạn trả tự động & ghi chú */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Hạn trả sách dự kiến
                </label>
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800">
                  <div className="flex items-center gap-2.5 font-semibold text-stone-900">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    {isLoadingMaxLoanDays ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 font-normal">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang tải cấu hình hạn trả...
                      </span>
                    ) : (
                      <span>{calculatedDueDateText}</span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                    +{maxLoanDays} ngày
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Hạn trả sách được hệ thống tự động tính theo cấu hình (mặc định {maxLoanDays} ngày kể từ thời điểm giao sách). Phiếu sẽ chuyển từ Chờ lấy sách (PENDING) sang Đang mượn (BORROWED).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Ghi chú giao sách
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Đã đối chiếu thẻ độc giả và giao sách tại quầy..."
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-emerald-600 transition-colors resize-none"
                />
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-stone-100 bg-stone-50/70">
          <button
            type="button"
            onClick={onClose}
            disabled={isFulfilling}
            className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="fulfill-loan-form"
            disabled={isFulfilling || isLoadingDetail || !loan}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isFulfilling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xác nhận...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xác nhận giao sách</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
