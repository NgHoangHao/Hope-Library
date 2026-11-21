"use client";

import React from "react";
import { ShieldCheck, Info } from "lucide-react";
import { TopCornerAlert } from "@/components/ui";

export interface PermissionMatrixHeaderProps {
  totalPermissions: number;
  totalRoles: number;
  canAssign?: boolean;
  feedback: { type: "success" | "error" | "info"; message: string } | null;
  onClearFeedback: () => void;
}

export function PermissionMatrixHeader({
  totalPermissions,
  totalRoles,
  canAssign = true,
  feedback,
  onClearFeedback,
}: PermissionMatrixHeaderProps) {
  return (
    <>
      {/* Thông báo dạng Alert nổi góc trên màn hình đồng bộ */}
      <TopCornerAlert feedback={feedback} onClose={onClearFeedback} />

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F5B82E] to-amber-600 flex items-center justify-center text-stone-950 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Ma trận Phân quyền Vai trò
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Thiết lập và quản lý quyền hạn chi tiết (API Permissions Matrix) cho từng vai trò trong hệ thống Hope Library
              </p>
            </div>
          </div>

          {/* Thống kê nhanh */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-[90px]">
              <span className="block text-xs font-medium text-stone-500">Vai trò</span>
              <span className="text-lg font-bold text-stone-900">{totalRoles}</span>
            </div>
            <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-center min-w-[90px]">
              <span className="block text-xs font-medium text-stone-500">Tổng Quyền hạn</span>
              <span className="text-lg font-bold text-[#B8860B]">{totalPermissions}</span>
            </div>
          </div>
        </div>

        {/* Cảnh báo thiếu quyền hạn gán */}
        {!canAssign && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bạn chỉ có quyền xem ma trận. Cần quyền hạn{" "}
              <code className="font-mono font-semibold px-1 py-0.5 bg-amber-100 rounded">
                ROLE_PERMISSION_ASSIGN
              </code>{" "}
              để chỉnh sửa hoặc lưu thay đổi phân quyền.
            </span>
          </div>
        )}
      </div>
    </>
  );
}
