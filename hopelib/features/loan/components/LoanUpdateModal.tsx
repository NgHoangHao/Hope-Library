"use client";

import React, { useEffect, useState } from "react";
import {
  Barcode,
  BookOpen,
  CheckCheck,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { getBookCoverUrl } from "@/features/book";
import {
  FineStatus,
  LoanDetailResponseData,
  LoanItemStatus,
  UpdateLoanInput,
} from "../types/loan.types";
import {
  LOAN_ITEM_STATUS_LABELS,
  LOAN_STATUS_CONFIG,
} from "../utils/loanDisplay";
import { LoanFineStatusList } from "./LoanFineStatusList";

const LOAN_ITEM_STATUS_OPTIONS: LoanItemStatus[] = [
  "BORROWED",
  "RETURNED",
  "OVERDUE",
  "LOST",
  "DAMAGED",
];

interface EditableLoanItem {
  id: string;
  bookCopyId: string;
  title?: string | null;
  url?: string | null;
  barcode?: string;
  status: LoanItemStatus;
  returnedDate: string;
}

function toDateInputValue(dateStr?: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toIsoDateOrNull(dateInput: string): string | null {
  if (!dateInput.trim()) return null;
  const date = new Date(`${dateInput}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export interface LoanUpdateModalProps {
  isOpen: boolean;
  isLoadingDetail: boolean;
  isUpdating: boolean;
  loan: LoanDetailResponseData | null;
  canUpdateFine?: boolean;
  updatingFineId?: string | null;
  onClose: () => void;
  onSubmit: (loanId: string, input: UpdateLoanInput) => Promise<boolean>;
  onUpdateFineStatus?: (fineId: string, status: FineStatus) => Promise<boolean>;
}

export function LoanUpdateModal({
  isOpen,
  isLoadingDetail,
  isUpdating,
  loan,
  canUpdateFine = false,
  updatingFineId = null,
  onClose,
  onSubmit,
  onUpdateFineStatus,
}: LoanUpdateModalProps) {
  const [loanDate, setLoanDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<EditableLoanItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!loan) return;
    setLoanDate(toDateInputValue(loan.loanDate));
    setDueDate(toDateInputValue(loan.dueDate));
    setReturnDate(toDateInputValue(loan.returnDate));
    setNotes(loan.notes ?? "");
    setItems(
      (loan.items ?? []).map((item) => ({
        id: item.id,
        bookCopyId: item.bookCopyId,
        title: item.title,
        url: item.url,
        barcode: item.bookCopy?.barcode || item.bookCopyId,
        status: item.status,
        returnedDate: toDateInputValue(item.returnedDate),
      }))
    );
    setValidationError(null);
  }, [loan]);

  if (!isOpen) return null;

  const allItemsReturned =
    items.length > 0 && items.every((item) => item.status === "RETURNED");
  const effectiveStatus = allItemsReturned
    ? "RETURNED"
    : (loan?.status ?? "BORROWED");
  const effectiveStatusCfg = LOAN_STATUS_CONFIG[effectiveStatus];

  const handleItemChange = (
    itemId: string,
    field: keyof Pick<EditableLoanItem, "status" | "returnedDate">,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };
        // Tự điền ngày trả hôm nay nếu chuyển sang RETURNED mà chưa có ngày trả
        if (field === "status" && value === "RETURNED" && !item.returnedDate) {
          updated.returnedDate = toDateInputValue(new Date().toISOString());
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleMarkAllReturned = () => {
    const today = toDateInputValue(new Date().toISOString());
    setReturnDate((prev) => prev || today);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        status: "RETURNED",
        returnedDate: item.returnedDate || today,
      }))
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;

    if (!dueDate) {
      setValidationError("Hạn trả sách không được để trống.");
      return;
    }

    if (loanDate && dueDate && new Date(dueDate) < new Date(loanDate)) {
      setValidationError("Hạn trả sách phải lớn hơn hoặc bằng ngày mượn.");
      return;
    }

    setValidationError(null);

    const payload: UpdateLoanInput = {
      loanDate: toIsoDateOrNull(loanDate) || undefined,
      dueDate: toIsoDateOrNull(dueDate) || undefined,
      returnDate: toIsoDateOrNull(returnDate),
      notes: notes.trim() ? notes.trim() : null,
      items: items.map((item) => ({
        id: item.id,
        bookCopyId: item.bookCopyId,
        status: item.status,
        returnedDate: toIsoDateOrNull(item.returnedDate),
      })),
    };

    await onSubmit(loan.id, payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Cập nhật phiếu mượn
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
            disabled={isUpdating}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isLoadingDetail || !loan ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-stone-500">
            <Loader2 className="w-7 h-7 animate-spin text-[#B8860B]" />
            <p className="text-xs sm:text-sm">
              Đang tải thông tin phiếu mượn...
            </p>
          </div>
        ) : (
          <form
            id="update-loan-form"
            onSubmit={handleFormSubmit}
            className="p-6 overflow-y-auto space-y-6"
          >
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {validationError}
              </div>
            )}

            {/* Loan Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Trạng thái phiếu mượn
                </label>
                <div className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${effectiveStatusCfg.badgeClass}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${effectiveStatusCfg.dotClass}`}
                    />
                    {effectiveStatusCfg.label} ({effectiveStatus})
                  </span>
                  {allItemsReturned && loan.status !== "RETURNED" && (
                    <span className="text-[11px] font-medium text-emerald-700">
                      Tự động khi lưu
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Tự động chuyển sang Đã trả (RETURNED) khi tất cả sách bên dưới đều có trạng thái Đã trả.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Ngày mượn
                </label>
                <input
                  type="date"
                  value={loanDate}
                  onChange={(e) => setLoanDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:bg-white focus:border-[#B8860B] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Hạn trả sách <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:bg-white focus:border-[#B8860B] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Ngày trả thực tế
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:bg-white focus:border-[#B8860B] transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú về phiếu mượn..."
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-[#B8860B] transition-colors resize-none"
                />
              </div>
            </div>

            {/* Loan Items Editor */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#B8860B]" />
                  <span>Danh sách bản sao sách ({items.length})</span>
                </h3>

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllReturned}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Đánh dấu đã trả tất cả</span>
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-500 italic text-center">
                  Không còn bản sao sách nào trong phiếu mượn.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const coverUrl = getBookCoverUrl(item.url);

                    return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
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

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-900 truncate">
                              {item.title || "Sách chưa cập nhật tên"}
                            </p>
                            <p className="text-xs text-stone-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <Barcode className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span className="truncate">{item.barcode}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Xóa bản sao này khỏi phiếu mượn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                            Trạng thái mục mượn
                          </label>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleItemChange(item.id, "status", e.target.value)
                            }
                            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-[#B8860B]"
                          >
                            {LOAN_ITEM_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {LOAN_ITEM_STATUS_LABELS[opt]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                            Ngày trả sách
                          </label>
                          <input
                            type="date"
                            value={item.returnedDate}
                            onChange={(e) =>
                              handleItemChange(
                                item.id,
                                "returnedDate",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:border-[#B8860B]"
                          />
                        </div>
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
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-stone-100 bg-stone-50/70">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="update-loan-form"
            disabled={isUpdating || isLoadingDetail || !loan}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5B82E] hover:bg-[#e5a922] text-[#1A1A1A] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
