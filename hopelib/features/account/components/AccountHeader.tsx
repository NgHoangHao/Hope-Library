"use client";

import React from "react";
import { Users, RefreshCw } from "lucide-react";
import { TopCornerAlert, AlertFeedback } from "@/components/ui";

export interface AccountHeaderProps {
  totalCount: number;
  isLoading: boolean;
  feedback: AlertFeedback | null;
  onClearFeedback: () => void;
  onRefresh: () => void;
}

export function AccountHeader({
  totalCount,
  isLoading,
  feedback,
  onClearFeedback,
  onRefresh,
}: AccountHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Toast Alert thông báo góc phải trên */}
      <TopCornerAlert feedback={feedback} onClose={onClearFeedback} />

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5B82E] to-amber-600 flex items-center justify-center text-stone-950 shadow-xs shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Quản lý Tài khoản Người dùng
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Xem danh sách, tìm kiếm, lọc theo vai trò, trạng thái và thêm mới hoặc xóa tài khoản
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-[120px]">
              <span className="block text-xs font-medium text-stone-500">Tổng tài khoản</span>
              <span className="text-lg font-bold text-[#B8860B]">{totalCount}</span>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Làm mới danh sách"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded-xl transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-600" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
