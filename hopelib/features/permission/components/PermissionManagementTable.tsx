"use client";

import React from "react";
import { Edit3, Trash2, KeyRound, Loader2, Tag } from "lucide-react";
import { PermissionItem } from "../types/permission.types";
import { formatPermissionDisplay } from "../utils/permissionLabel.helper";
import { cn } from "@/lib/utils";

export interface PermissionManagementTableProps {
  permissions: PermissionItem[];
  isLoading: boolean;
  onEdit: (item: PermissionItem) => void;
  onDelete: (item: PermissionItem) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

export function PermissionManagementTable({
  permissions,
  isLoading,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
}: PermissionManagementTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-20 flex flex-col items-center justify-center gap-3 text-stone-500 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium">Đang tải danh sách quyền hạn...</span>
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <KeyRound className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Không tìm thấy quyền hạn nào
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          Không có quyền hạn nào phù hợp với bộ lọc đối tượng hoặc từ khóa tìm kiếm.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-700 border-collapse">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/75 text-xs font-semibold text-stone-500 uppercase tracking-wider select-none">
              <th scope="col" className="py-3.5 px-4 w-16 text-center">
                STT
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[240px]">
                Mã quyền hạn (Code)
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[150px]">
                Mục đối tượng
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[130px]">
                Hành động
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[280px]">
                Mô tả chi tiết
              </th>
              <th scope="col" className="py-3.5 px-4 w-32 text-right">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {permissions.map((perm, index) => {
              const { module, action } = formatPermissionDisplay(
                perm.code,
                perm.description
              );

              return (
                <tr
                  key={perm.id}
                  className="hover:bg-stone-50/80 transition-colors group"
                >
                  {/* STT */}
                  <td className="py-3.5 px-4 text-center font-mono text-xs text-stone-400">
                    {index + 1}
                  </td>

                  {/* Mã quyền hạn (Code) */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-stone-900 group-hover:text-amber-700 transition-colors text-xs">
                          {perm.code}
                        </span>
                        <span className="block text-[10px] font-mono text-stone-400">
                          ID: {perm.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Mục đối tượng (Module) */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/60">
                      <Tag className="w-3 h-3 text-stone-500 shrink-0" />
                      <span>{module}</span>
                    </span>
                  </td>

                  {/* Hành động (Action) */}
                  <td className="py-3.5 px-4">
                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase px-2 py-0.5 rounded-md",
                        action === "Xem" && "bg-sky-50 text-sky-700 border border-sky-200",
                        action === "Thêm mới" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        action === "Cập nhật" && "bg-amber-50 text-amber-700 border border-amber-200",
                        action === "Xóa" && "bg-rose-50 text-rose-700 border border-rose-200",
                        action === "Phân quyền" && "bg-purple-50 text-purple-700 border border-purple-200"
                      )}
                    >
                      {action}
                    </span>
                  </td>

                  {/* Mô tả */}
                  <td className="py-3.5 px-4">
                    {perm.description ? (
                      <p className="text-stone-600 text-xs leading-relaxed line-clamp-2">
                        {perm.description}
                      </p>
                    ) : (
                      <span className="text-stone-400 italic text-xs">
                        Chưa có mô tả chi tiết
                      </span>
                    )}
                  </td>

                  {/* Thao tác (Chỉ Sửa và Xóa, không có ViewDetail) */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Nút Sửa */}
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => onEdit(perm)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200/60 cursor-pointer"
                          title="Chỉnh sửa quyền hạn này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                      )}

                      {/* Nút Xóa */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(perm)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200/60 cursor-pointer"
                          title="Xóa quyền hạn này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
