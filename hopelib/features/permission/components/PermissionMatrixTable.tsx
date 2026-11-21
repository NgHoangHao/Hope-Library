"use client";

import React from "react";
import { Check, Loader2, Shield } from "lucide-react";
import { PermissionItem, RoleItem } from "../types/permission.types";
import { formatPermissionDisplay } from "../utils/permissionLabel.helper";
import { cn } from "@/lib/utils";

export interface PermissionMatrixTableProps {
  roles: RoleItem[];
  permissions: PermissionItem[];
  hasPermissionInMatrix: (roleId: string, permissionId: string) => boolean;
  onToggleCell: (roleId: string, permissionId: string) => void;
  onToggleRow?: (permissionId: string) => void;
  onToggleColumn?: (roleId: string) => void;
  isRowFullyChecked?: (permissionId: string) => boolean;
  isColumnFullyChecked?: (roleId: string) => boolean;
  canAssign?: boolean;
  isLoading?: boolean;
}

export function PermissionMatrixTable({
  roles,
  permissions,
  hasPermissionInMatrix,
  onToggleCell,
  onToggleRow,
  onToggleColumn,
  isRowFullyChecked,
  isColumnFullyChecked,
  canAssign = true,
  isLoading = false,
}: PermissionMatrixTableProps) {
  if (isLoading) {
    return (
      <div className="bg-[#0f0f10] text-stone-300 rounded-2xl p-16 border border-stone-800 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium text-stone-400">
          Đang tải dữ liệu ma trận phân quyền...
        </span>
      </div>
    );
  }

  if (roles.length === 0 || permissions.length === 0) {
    return (
      <div className="bg-[#0f0f10] text-stone-300 rounded-2xl p-16 border border-stone-800 text-center">
        <Shield className="w-10 h-10 text-stone-600 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-stone-200">
          Không có quyền hạn hoặc vai trò nào
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          Vui lòng thử lại với bộ lọc khác hoặc kiểm tra lại cấu hình hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0c0c0d] rounded-2xl border border-stone-800/80 shadow-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-stone-200">
          {/* Header Row */}
          <thead>
            <tr className="border-b border-stone-800/90 bg-[#141416]/90 text-xs font-semibold text-stone-300 select-none">
              {/* Cột 1: Quyền (Permission) - Cố định (Sticky) */}
              <th
                scope="col"
                className="py-4 px-6 min-w-[260px] sm:min-w-[320px] sticky left-0 z-20 bg-[#141416] text-stone-300 tracking-wide font-medium"
              >
                Quyền (Permission)
              </th>

              {/* Các cột Vai trò (Roles) */}
              {roles.map((role) => {
                const isAllChecked = isColumnFullyChecked
                  ? isColumnFullyChecked(role.id)
                  : false;

                return (
                  <th
                    key={role.id}
                    scope="col"
                    className="py-4 px-6 text-center min-w-[140px] font-medium"
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="font-semibold text-stone-100 hover:text-[#F5B82E] transition-colors">
                        {role.name}
                      </span>
                      {onToggleColumn && canAssign && (
                        <button
                          type="button"
                          onClick={() => onToggleColumn(role.id)}
                          className="text-[10px] text-stone-400 hover:text-white underline cursor-pointer"
                          title="Chọn/Bỏ chọn tất cả quyền cho vai trò này"
                        >
                          {isAllChecked ? "Bỏ chọn hết" : "Chọn tất cả"}
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body Rows */}
          <tbody className="divide-y divide-stone-800/60">
            {permissions.map((perm) => {
              const formatted = formatPermissionDisplay(perm.code, perm.description);
              const isRowChecked = isRowFullyChecked
                ? isRowFullyChecked(perm.id)
                : false;

              return (
                <tr
                  key={perm.id}
                  className="hover:bg-stone-900/60 transition-colors duration-100 group"
                >
                  {/* Cột 1: Tên quyền theo format "Module: Action" (Sticky) */}
                  <td className="py-4 px-6 sticky left-0 z-10 bg-[#0c0c0d] group-hover:bg-[#141416] transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {/* Định dạng văn bản đúng như trong hình ảnh thiết kế: "Người dùng: Xem" */}
                        <span className="font-medium text-stone-100 text-sm tracking-tight block">
                          {formatted.displayText}
                        </span>

                        {/* Mã code và mô tả phụ */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-stone-400 tracking-wider">
                            {perm.code}
                          </span>
                          {perm.description && (
                            <span className="text-[11px] text-stone-400 truncate max-w-xs hidden sm:inline">
                              • {perm.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nút toggle toàn bộ hàng */}
                      {onToggleRow && canAssign && (
                        <button
                          type="button"
                          onClick={() => onToggleRow(perm.id)}
                          className="text-[10px] text-stone-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer px-1.5 py-0.5 rounded bg-stone-800 shrink-0"
                          title="Bật/Tắt quyền này cho tất cả vai trò"
                        >
                          {isRowChecked ? "Bỏ hết" : "Gán hết"}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Các ô Checkbox theo từng vai trò */}
                  {roles.map((role) => {
                    const checked = hasPermissionInMatrix(role.id, perm.id);

                    return (
                      <td
                        key={role.id}
                        className="py-4 px-6 text-center align-middle"
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          disabled={!canAssign}
                          onClick={() => onToggleCell(role.id, perm.id)}
                          className={cn(
                            "w-6 h-6 mx-auto rounded flex items-center justify-center transition-all duration-150 select-none",
                            "focus:outline-hidden focus:ring-2 focus:ring-[#F5B82E]/50",
                            !canAssign && "cursor-not-allowed opacity-60",
                            canAssign && "cursor-pointer",
                            checked
                              ? "bg-transparent border-2 border-stone-200 text-white hover:border-[#F5B82E] hover:text-[#F5B82E]"
                              : "bg-transparent border-2 border-stone-600/80 hover:border-stone-400"
                          )}
                        >
                          {checked && (
                            <Check className="w-4 h-4 stroke-[3] text-stone-100" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
