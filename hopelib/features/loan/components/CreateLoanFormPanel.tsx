"use client";

import React from "react";
import {
  Calendar,
  FileText,
  Trash2,
  CheckCircle2,
  Loader2,
  BookCheck,
  BookOpen,
  Barcode,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { getBookCoverUrl } from "@/features/book";
import {
  LoanStatus,
  SelectedBookCopyForLoan,
  LoanDetailResponseData,
} from "../types/loan.types";

export interface CreateLoanFormPanelProps {
  loanDate: string;
  dueDate: string;
  loanStatus: LoanStatus;
  notes: string;
  selectedItems: SelectedBookCopyForLoan[];
  isSubmitting: boolean;
  canCreateLoan: boolean;
  createdLoan: LoanDetailResponseData | null;
  onLoanDateChange: (val: string) => void;
  onDueDateChange: (val: string) => void;
  onQuickDueDate: (days: number) => void;
  onLoanStatusChange: (status: LoanStatus) => void;
  onNotesChange: (val: string) => void;
  onRemoveSelectedCopy: (bookCopyId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBackToUsers: () => void;
}

export function CreateLoanFormPanel({
  loanDate,
  dueDate,
  loanStatus,
  notes,
  selectedItems,
  isSubmitting,
  canCreateLoan,
  createdLoan,
  onLoanDateChange,
  onDueDateChange,
  onQuickDueDate,
  onLoanStatusChange,
  onNotesChange,
  onRemoveSelectedCopy,
  onSubmit,
  onBackToUsers,
}: CreateLoanFormPanelProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-5"
    >
      <div className="border-b border-stone-100 pb-3">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <BookCheck className="w-4 h-4 text-[#B8860B]" />
          <span>Thông tin Phiếu Mượn & Sách Đã Chọn</span>
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Kiểm tra danh sách bản sao sách và hạn trả trước khi gửi POST /loans
        </p>
      </div>

      {/* Ngày mượn & Hạn trả */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">
            Ngày mượn sách (loanDate)
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={loanDate}
              onChange={(e) => onLoanDateChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs sm:text-sm border border-stone-200 bg-stone-50/50 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">
            Hạn trả sách (dueDate) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={dueDate}
              min={loanDate}
              onChange={(e) => onDueDateChange(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs sm:text-sm border border-stone-200 bg-stone-50/50 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50"
            />
          </div>
        </div>
      </div>

      {/* Chọn nhanh thời hạn mượn */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-stone-500 flex items-center gap-1 mr-1">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Chọn nhanh hạn trả:
        </span>
        {[7, 14, 21, 30].map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => onQuickDueDate(days)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200/80 transition-colors cursor-pointer"
          >
            +{days} ngày
          </button>
        ))}
      </div>

      {/* Trạng thái phiếu mượn & Ghi chú */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">
            Trạng thái phiếu mượn (status)
          </label>
          <select
            value={loanStatus}
            onChange={(e) => onLoanStatusChange(e.target.value as LoanStatus)}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border border-stone-200 bg-stone-50/50 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50 cursor-pointer"
          >
            <option value="BORROWED">Đang mượn (BORROWED)</option>
            <option value="PENDING">Chờ nhận sách (PENDING)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">
            Ghi chú phiếu mượn (notes)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Ghi chú thêm khi giao sách cho độc giả (tùy chọn)..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-stone-200 bg-stone-50/50 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/50"
            />
          </div>
        </div>
      </div>

      {/* Danh sách các mục sách mượn (items) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Danh sách bản sao mượn ({selectedItems.length} cuốn)
          </span>
        </div>

        {selectedItems.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 text-center text-xs text-stone-500">
            Chưa có bản sao sách nào được chọn. Vui lòng chọn bản sao sách từ khung bên trái.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {selectedItems.map((item, idx) => {
              const coverUrl = getBookCoverUrl(item.bookUrl);
              return (
                <div
                  key={item.bookCopyId}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-12 rounded-md overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center shrink-0">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl}
                          alt={item.bookTitle || "Bìa sách"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <BookOpen className="w-4 h-4 text-stone-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-semibold text-stone-900 truncate">
                        {idx + 1}. {item.bookTitle || "Bản sao sách"}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Barcode className="w-3 h-3" />
                          {item.barcode}
                        </span>
                        {item.shelfLocation && (
                          <span>Kệ: {item.shelfLocation}</span>
                        )}
                        <span className="font-mono text-[10px] text-stone-400 truncate">
                          ({item.bookCopyId})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveSelectedCopy(item.bookCopyId)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    title="Xóa bản sao này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nút Submit POST /loans */}
      {canCreateLoan && (
        <button
          type="submit"
          disabled={isSubmitting || selectedItems.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F5B82E] hover:bg-amber-400 text-stone-950 text-sm font-bold shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tạo phiếu mượn...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận Tạo Phiếu Mượn ({selectedItems.length} cuốn)</span>
            </>
          )}
        </button>
      )}

      {/* Kết quả phiếu mượn vừa tạo thành công */}
      {createdLoan && (
        <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-2.5 text-xs text-emerald-950">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã tạo phiếu mượn thành công!</span>
          </div>
          <div className="space-y-1 text-emerald-900">
            <div>
              Mã phiếu mượn:{" "}
              <span className="font-mono font-bold">{createdLoan.id}</span>
            </div>
            <div>
              Mã độc giả (userId):{" "}
              <span className="font-mono font-semibold">{createdLoan.userId}</span>
            </div>
            <div>
              Hạn trả:{" "}
              <span className="font-semibold">
                {new Date(createdLoan.dueDate).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div>
              Số lượng bản sao:{" "}
              <span className="font-bold">
                {createdLoan.items?.length ?? 0} cuốn
              </span>
            </div>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={onBackToUsers}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay về danh sách độc giả</span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
