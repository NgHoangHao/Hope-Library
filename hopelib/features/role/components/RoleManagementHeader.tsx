"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";
import { RoleFeedback } from "../types/role.types";
import { TopCornerAlert } from "@/components/ui";

export interface RoleManagementHeaderProps {
  totalCount: number;
  feedback: RoleFeedback | null;
  onClearFeedback: () => void;
}

export function RoleManagementHeader({
  totalCount,
  feedback,
  onClearFeedback,
}: RoleManagementHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Thông báo dạng Alert nổi góc trên màn hình đồng bộ */}
      <TopCornerAlert feedback={feedback} onClose={onClearFeedback} />

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F5B82E] to-amber-600 flex items-center justify-center text-stone-950 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Quản lý Vai trò Hệ thống
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Quản lý danh sách vai trò người dùng (Roles), phân quyền và kiểm soát truy cập chức năng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-[120px]">
              <span className="block text-xs font-medium text-stone-500">Tổng số vai trò</span>
              <span className="text-lg font-bold text-[#B8860B]">{totalCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
