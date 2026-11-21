"use client";

import React from "react";
import { ArrowLeft, BookPlus } from "lucide-react";
import { TopCornerAlert, AlertFeedback } from "@/components/ui";

export interface CreateLoanHeaderProps {
  feedback: AlertFeedback | null;
  onClearFeedback: () => void;
  onBack: () => void;
}

export function CreateLoanHeader({
  feedback,
  onClearFeedback,
  onBack,
}: CreateLoanHeaderProps) {
  return (
    <div className="space-y-4">
      <TopCornerAlert feedback={feedback} onClose={onClearFeedback} />

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5B82E] to-amber-600 flex items-center justify-center text-stone-950 shadow-xs shrink-0">
              <BookPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Lập Phiếu Mượn Sách Mới
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Chọn các bản sao sách khả dụng và thiết lập hạn trả cho độc giả đã chọn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded-xl transition-all cursor-pointer self-start sm:self-center active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách độc giả</span>
          </button>
        </div>
      </div>
    </div>
  );
}
