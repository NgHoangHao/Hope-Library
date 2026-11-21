"use client";

import React from "react";
import { Bookmark } from "lucide-react";
import { CategoryFeedback } from "../types/category.types";
import { TopCornerAlert } from "@/components/ui";

export interface CategoryHeaderProps {
  totalCount: number;
  feedback: CategoryFeedback | null;
  onClearFeedback: () => void;
}

export function CategoryHeader({
  totalCount,
  feedback,
  onClearFeedback,
}: CategoryHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Thông báo dạng Alert nổi góc trên màn hình đồng bộ */}
      <TopCornerAlert feedback={feedback} onClose={onClearFeedback} />

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F5B82E] to-amber-600 flex items-center justify-center text-stone-950 shadow-xs">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Quản lý Thể loại sách
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Xem danh mục thể loại, xem sách liên kết và cập nhật thông tin phân loại
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-[110px]">
              <span className="block text-xs font-medium text-stone-500">Tổng thể loại</span>
              <span className="text-lg font-bold text-[#B8860B]">{totalCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
