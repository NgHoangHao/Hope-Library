"use client";

import React from "react";
import {
  Barcode,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
  X,
} from "lucide-react";
import { getBookCoverUrl } from "@/features/book";
import { FineStatus, LoanDetailResponseData } from "../types/loan.types";
import {
  formatLoanDate,
  formatLoanDateTime,
  LOAN_ITEM_STATUS_LABELS,
  LOAN_STATUS_CONFIG,
} from "../utils/loanDisplay";
import { LoanFineStatusList } from "./LoanFineStatusList";

export interface LoanDetailModalProps {
  isOpen: boolean;
  isLoading: boolean;
  loan: LoanDetailResponseData | null;
  canUpdate: boolean;
  canUpdateFine?: boolean;
  updatingFineId?: string | null;
  onClose: () => void;
  onOpenEdit: (loan: LoanDetailResponseData) => void;
  onOpenFulfill?: (loan: LoanDetailResponseData) => void;
  onUpdateFineStatus?: (fineId: string, status: FineStatus) => Promise<boolean>;
}

export function LoanDetailModal({
  isOpen,
  isLoading,
  loan,
  canUpdate,
  canUpdateFine = false,
  updatingFineId = null,
  onClose,
  onOpenEdit,
  onOpenFulfill,
  onUpdateFineStatus,
}: LoanDetailModalProps) {
  if (!isOpen) return null;

  const statusCfg = loan ? LOAN_STATUS_CONFIG[loan.status] : null;
  const isPending = loan?.status === "PENDING";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/55 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Chi tiết phiếu mượn
            </h2>
            {loan && (
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                {loan.id}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-500 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#B8860B]" />
              <p className="text-xs sm:text-sm">
                Đang tải chi tiết phiếu mượn...
              </p>
            </div>
          ) : !loan ? (
            <div className="py-10 text-center text-sm text-stone-500">
              Không có dữ liệu chi tiết phiếu mượn.
            </div>
          ) : (
            <>
              {/* Borrower Info Card */}
              <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
                  <User className="w-3.5 h-3.5" />
                  <span>Thông tin người mượn</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-stone-500">Họ tên / Tài khoản:</span>
                    <p className="font-semibold text-stone-900 mt-0.5">
                      {loan.user?.fullName || loan.user?.username || "Chưa rõ"}
                      {loan.user?.username && loan.user?.fullName ? (
                        <span className="text-stone-500 font-normal ml-1">
                          (@{loan.user.username})
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-500">Mã người dùng:</span>
                    <p className="font-mono text-stone-800 mt-0.5 break-all">
                      {loan.user?.code || loan.userId}
                    </p>
                  </div>
                  {loan.user?.email && (
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{loan.user.email}</span>
                    </div>
                  )}
                  {loan.user?.phone && (
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{loan.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Loan Metadata Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 border border-stone-200/70 rounded-xl p-4 text-xs">
                <div>
                  <span className="text-stone-400 font-medium">Trạng thái</span>
                  <div className="mt-1">
                    {statusCfg && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.badgeClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`}
                        />
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-stone-400 font-medium">
                    Ngày mượn / đặt
                  </span>
                  <p className="text-stone-900 font-semibold mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {formatLoanDateTime(loan.loanDate)}
                  </p>
                </div>

                <div>
                  <span className="text-stone-400 font-medium">
                    {isPending ? "Hạn lấy sách (48h)" : "Hạn trả sách"}
                  </span>
                  <p className="text-stone-900 font-semibold mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {isPending && loan.pickupDeadline
                      ? formatLoanDateTime(loan.pickupDeadline)
                      : formatLoanDate(loan.dueDate)}
                  </p>
                </div>

                <div>
                  <span className="text-stone-400 font-medium">
                    Ngày trả thực tế
                  </span>
                  <p className="text-stone-900 font-semibold mt-1">
                    {formatLoanDateTime(loan.returnDate)}
                  </p>
                </div>

                {loan.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-stone-200/70">
                    <span className="text-stone-400 font-medium">Ghi chú</span>
                    <p className="text-stone-700 mt-1 whitespace-pre-wrap">
                      {loan.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Loan Items */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#B8860B]" />
                  <span>
                    Danh sách bản sao sách ({loan.items?.length || 0})
                  </span>
                </h3>

                {!loan.items || loan.items.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">
                    Chưa có mục sách nào trong phiếu mượn này.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {loan.items.map((item) => {
                      const coverUrl = getBookCoverUrl(item.url);

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-stone-200 bg-white text-xs"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-12 h-16 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center shrink-0">
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
                                <BookOpen className="w-5 h-5 text-stone-400" />
                              )}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <p className="text-sm font-semibold text-stone-900 truncate">
                                {item.title || "Sách chưa cập nhật tên"}
                              </p>
                              <div className="flex items-center gap-1.5 font-medium text-stone-600">
                                <Barcode className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span className="truncate font-mono">
                                  {item.bookCopy?.barcode || item.bookCopyId}
                                </span>
                              </div>
                              {item.bookCopy?.shelfLocation && (
                                <p className="text-stone-500 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                  <span>
                                    Vị trí kệ: {item.bookCopy.shelfLocation}
                                  </span>
                                </p>
                              )}
                              {item.returnedDate && (
                                <p className="text-emerald-700 font-medium">
                                  Đã trả ngày: {formatLoanDate(item.returnedDate)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold">
                              {LOAN_ITEM_STATUS_LABELS[item.status] ||
                                item.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Fines */}
              <LoanFineStatusList
                fines={loan.fines}
                canUpdateFine={canUpdateFine}
                updatingFineId={updatingFineId}
                onUpdateFineStatus={onUpdateFineStatus}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-stone-100 bg-stone-50/70">
          {canUpdate && loan && !isLoading &&
            (isPending && onOpenFulfill ? (
              <button
                type="button"
                onClick={() => onOpenFulfill(loan)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Xác nhận giao sách</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenEdit(loan)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5B82E] hover:bg-[#e5a922] text-[#1A1A1A] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Chỉnh sửa phiếu mượn</span>
              </button>
            ))}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
