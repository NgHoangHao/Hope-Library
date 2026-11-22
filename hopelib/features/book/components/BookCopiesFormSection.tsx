"use client";

import React, { useState } from "react";
import { Barcode, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import {
  BookCopyStatus,
  EDITABLE_BOOK_COPY_STATUS_OPTIONS,
} from "../types/book.types";

export interface FormCopyItem {
  localKey: string;
  id?: string;
  barcode: string;
  shelfLocation: string;
  status: BookCopyStatus;
}

export interface BookCopiesFormSectionProps {
  mode: "create" | "edit";
  copies: FormCopyItem[];
  isLoadingCopies?: boolean;
  isSubmitting: boolean;
  onAddCopy: () => void;
  onRemoveCopy: (localKey: string) => void;
  onCopyChange: (
    localKey: string,
    field: "barcode" | "shelfLocation" | "status",
    value: string
  ) => void;
  onBatchAddCopies: (items: FormCopyItem[]) => void;
  onClearAllCopies: () => void;
  onValidationError: (message: string | null) => void;
}

const EDITABLE_STATUS_SET = new Set<string>(
  EDITABLE_BOOK_COPY_STATUS_OPTIONS.map((opt) => opt.value)
);

export function BookCopiesFormSection({
  mode,
  copies,
  isLoadingCopies = false,
  isSubmitting,
  onAddCopy,
  onRemoveCopy,
  onCopyChange,
  onBatchAddCopies,
  onClearAllCopies,
  onValidationError,
}: BookCopiesFormSectionProps) {
  const [showBatchTools, setShowBatchTools] = useState(false);
  const [batchCount, setBatchCount] = useState<number>(3);
  const [batchPrefix, setBatchPrefix] = useState("BC-");
  const [batchStartNum, setBatchStartNum] = useState<number>(1);
  const [batchShelfLocation, setBatchShelfLocation] = useState("");

  const filledCount = copies.filter((c) => c.barcode.trim()).length;

  const handleBatchGenerate = () => {
    if (batchCount <= 0 || batchCount > 50) {
      onValidationError("Số lượng bản sao tạo nhanh phải từ 1 đến 50.");
      return;
    }

    const newGenerated: FormCopyItem[] = [];
    const padLength = Math.max(4, String(batchStartNum + batchCount).length);
    for (let i = 0; i < batchCount; i++) {
      const num = batchStartNum + i;
      const barcode = `${batchPrefix}${String(num).padStart(padLength, "0")}`;
      newGenerated.push({
        localKey: `copy-batch-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        barcode,
        shelfLocation: batchShelfLocation.trim(),
        status: "AVAILABLE",
      });
    }

    onBatchAddCopies(newGenerated);
    setShowBatchTools(false);
    onValidationError(null);
  };

  return (
    <div className="pt-4 border-t border-stone-100 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Barcode className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
            {mode === "create"
              ? "Danh sách bản sao (Copies) - Tùy chọn"
              : "Quản lý bản sao (Copies)"}
          </span>
          {!isLoadingCopies && filledCount > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {filledCount} bản sao
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBatchTools((prev) => !prev)}
            disabled={isSubmitting || isLoadingCopies}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer disabled:opacity-50 ${
              showBatchTools
                ? "bg-amber-100 border-amber-300 text-amber-900"
                : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Tạo nhanh</span>
          </button>

          <button
            type="button"
            onClick={onAddCopy}
            disabled={isSubmitting || isLoadingCopies}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-400/30 hover:bg-amber-400/50 border border-amber-300/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm bản sao</span>
          </button>
        </div>
      </div>

      {/* Bảng công cụ tạo nhanh hàng loạt */}
      {showBatchTools && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Tự động sinh hàng loạt mã Barcode</span>
            </div>
            <span className="text-[11px] text-amber-700 font-mono">
              Xem trước: {batchPrefix}
              {String(batchStartNum).padStart(4, "0")} → {batchPrefix}
              {String(batchStartNum + Math.max(0, batchCount - 1)).padStart(4, "0")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-semibold text-amber-900 mb-1">
                Số lượng
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={batchCount}
                onChange={(e) =>
                  setBatchCount(Math.max(1, Number(e.target.value) || 1))
                }
                disabled={isSubmitting}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-amber-900 mb-1">
                Tiền tố Barcode
              </label>
              <input
                type="text"
                value={batchPrefix}
                onChange={(e) => setBatchPrefix(e.target.value)}
                disabled={isSubmitting}
                placeholder="BC-"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-amber-900 mb-1">
                Bắt đầu từ số
              </label>
              <input
                type="number"
                min={1}
                value={batchStartNum}
                onChange={(e) =>
                  setBatchStartNum(Math.max(1, Number(e.target.value) || 1))
                }
                disabled={isSubmitting}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-amber-900 mb-1">
                Vị trí kệ chung
              </label>
              <input
                type="text"
                value={batchShelfLocation}
                onChange={(e) => setBatchShelfLocation(e.target.value)}
                disabled={isSubmitting}
                placeholder="Kệ A1 - Tầng 2"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowBatchTools(false)}
              className="px-3 py-1 text-xs text-stone-600 hover:text-stone-800 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleBatchGenerate}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Tạo {batchCount} bản sao
            </button>
          </div>
        </div>
      )}

      {/* Danh sách các dòng bản sao */}
      {isLoadingCopies ? (
        <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50/60 flex items-center justify-center gap-2 text-xs text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-[#F5B82E]" />
          <span>Đang tải danh sách bản sao...</span>
        </div>
      ) : copies.length === 0 ? (
        <div className="p-4 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 text-center">
          <p className="text-xs text-stone-500 mb-2">
            Chưa có bản sao nào cho cuốn sách này.
          </p>
          <button
            type="button"
            onClick={onAddCopy}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm bản sao đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {copies.map((copyItem, index) => {
            const isLockedDelete =
              Boolean(copyItem.id) &&
              (copyItem.status === "BORROWED" || copyItem.status === "RESERVED");
            const isCurrentStatusOutsideEditable = !EDITABLE_STATUS_SET.has(
              copyItem.status
            );

            return (
              <div
                key={copyItem.localKey}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-white hover:border-amber-200 transition-all flex items-center gap-2.5"
              >
                <span className="w-7 text-center text-[11px] font-bold text-stone-400 font-mono shrink-0">
                  #{index + 1}
                </span>

                <div
                  className={`flex-1 grid grid-cols-1 gap-2 ${
                    mode === "edit" ? "sm:grid-cols-3" : "sm:grid-cols-2"
                  }`}
                >
                  <div>
                    <input
                      type="text"
                      value={copyItem.barcode}
                      onChange={(e) =>
                        onCopyChange(copyItem.localKey, "barcode", e.target.value)
                      }
                      disabled={isSubmitting}
                      placeholder={`Mã Barcode (VD: BC-${String(index + 1).padStart(4, "0")})...`}
                      className="w-full px-3 py-1.5 rounded-lg text-xs border border-stone-200 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={copyItem.shelfLocation}
                      onChange={(e) =>
                        onCopyChange(
                          copyItem.localKey,
                          "shelfLocation",
                          e.target.value
                        )
                      }
                      disabled={isSubmitting}
                      placeholder="Vị trí kệ (VD: Kệ A1 - Tầng 2)..."
                      className="w-full px-3 py-1.5 rounded-lg text-xs border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {mode === "edit" && (
                    <div>
                      <select
                        value={copyItem.status}
                        onChange={(e) =>
                          onCopyChange(copyItem.localKey, "status", e.target.value)
                        }
                        disabled={isSubmitting}
                        aria-label={`Trạng thái bản sao #${index + 1}`}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-stone-200 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        {isCurrentStatusOutsideEditable && (
                          <option value={copyItem.status} disabled hidden>
                            {copyItem.status}
                          </option>
                        )}
                        {EDITABLE_BOOK_COPY_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveCopy(copyItem.localKey)}
                  disabled={isSubmitting || isLockedDelete}
                  title={
                    isLockedDelete
                      ? "Không thể xóa bản sao đang được mượn hoặc đặt trước"
                      : "Xóa bản sao này"
                  }
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!isLoadingCopies && copies.length > 1 && (
        <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
          <span>
            Tổng cộng {copies.length} dòng (dòng để trống mã Barcode sẽ tự động được bỏ qua)
          </span>
          <button
            type="button"
            onClick={onClearAllCopies}
            disabled={isSubmitting}
            className="text-stone-400 hover:text-rose-600 hover:underline cursor-pointer"
          >
            {mode === "edit" ? "Xóa các bản sao có thể xóa" : "Xóa tất cả bản sao"}
          </button>
        </div>
      )}
    </div>
  );
}
