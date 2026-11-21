"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { TopCornerAlert } from "@/components/ui";
import { SystemConfigFeedback } from "../types/system-config.types";

export interface SystemConfigHeaderProps {
  totalCount: number;
  groupCount: number;
  dirtyCount: number;
  feedback: SystemConfigFeedback | null;
  onClearFeedback: () => void;
}

export function SystemConfigHeader({
  totalCount,
  groupCount,
  dirtyCount,
  feedback,
  onClearFeedback,
}: SystemConfigHeaderProps) {
  return (
    <div className="space-y-4">
      <TopCornerAlert feedback={feedback} onClose={onClearFeedback} />

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F5B82E] to-amber-600 flex items-center justify-center text-stone-950 shadow-xs shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Cấu hình Hệ thống
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Xem và điều chỉnh trực tiếp giá trị các tham số vận hành của Hope Library (đồng bộ Redis Cache tức thì)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-[96px]">
              <span className="block text-xs font-medium text-stone-500">Nhóm</span>
              <span className="text-lg font-bold text-stone-900">{groupCount}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-[96px]">
              <span className="block text-xs font-medium text-stone-500">Thông số</span>
              <span className="text-lg font-bold text-[#B8860B]">{totalCount}</span>
            </div>
            {dirtyCount > 0 && (
              <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center min-w-[96px]">
                <span className="block text-xs font-medium text-amber-700">Chưa lưu</span>
                <span className="text-lg font-bold text-amber-800">{dirtyCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
