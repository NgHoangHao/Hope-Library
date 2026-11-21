"use client";

import React from "react";
import Link from "next/link";
import { Edit3, Trash2, Shield, Loader2, KeyRound, Copy, Check } from "lucide-react";
import { RoleItem } from "../types/role.types";
import { cn } from "@/lib/utils";

export interface RoleManagementTableProps {
  roles: RoleItem[];
  isLoading: boolean;
  onEdit: (item: RoleItem) => void;
  onDelete: (item: RoleItem) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const SYSTEM_ROLES = ["ADMIN", "LIBRARIAN", "BORROWER"];

export function RoleManagementTable({
  roles,
  isLoading,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
}: RoleManagementTableProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-20 flex flex-col items-center justify-center gap-3 text-stone-500 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium">Đang tải danh sách vai trò...</span>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Không tìm thấy vai trò nào
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          Không có vai trò nào phù hợp với từ khóa tìm kiếm hoặc hệ thống chưa khởi tạo vai trò.
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
              <th scope="col" className="py-3.5 px-4 min-w-[200px]">
                Tên vai trò (Role Name)
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[280px]">
                Mô tả chi tiết
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[180px]">
                Mã ID
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[140px] text-center">
                Phân quyền
              </th>
              <th scope="col" className="py-3.5 px-4 w-32 text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {roles.map((role, index) => {
              const isSystemRole = SYSTEM_ROLES.includes(role.name.toUpperCase());
              const isCopied = copiedId === role.id;

              return (
                <tr
                  key={role.id}
                  className="hover:bg-stone-50/80 transition-colors group"
                >
                  {/* STT */}
                  <td className="py-3.5 px-4 text-center font-mono text-xs text-stone-400">
                    {index + 1}
                  </td>

                  {/* Tên vai trò */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                          role.name.toUpperCase() === "ADMIN" &&
                            "bg-purple-50 text-purple-700 border-purple-200",
                          role.name.toUpperCase() === "LIBRARIAN" &&
                            "bg-amber-50 text-[#B8860B] border-amber-200",
                          role.name.toUpperCase() === "BORROWER" &&
                            "bg-blue-50 text-blue-700 border-blue-200",
                          !isSystemRole &&
                            "bg-stone-100 text-stone-700 border-stone-200"
                        )}
                      >
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-stone-900 group-hover:text-amber-700 transition-colors text-sm">
                            {role.name}
                          </span>
                          {isSystemRole && (
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                              Hệ thống
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Mô tả */}
                  <td className="py-3.5 px-4">
                    {role.description ? (
                      <p className="text-stone-600 text-xs leading-relaxed line-clamp-2">
                        {role.description}
                      </p>
                    ) : (
                      <span className="text-stone-400 italic text-xs">
                        Chưa có mô tả chi tiết
                      </span>
                    )}
                  </td>

                  {/* Mã ID */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/80 text-xs font-mono text-stone-500">
                      <span>{role.id.slice(0, 8)}...</span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(role.id)}
                        className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                        title={isCopied ? "Đã sao chép!" : "Sao chép ID đầy đủ"}
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Phân quyền */}
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      href="/system/permissions"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200/80 hover:text-stone-900 rounded-lg transition-colors border border-stone-200/60"
                      title="Xem và chỉnh sửa ma trận quyền hạn của vai trò này"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ma trận quyền</span>
                    </Link>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Nút Sửa */}
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => onEdit(role)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200/60 cursor-pointer"
                          title="Chỉnh sửa vai trò này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                      )}

                      {/* Nút Xóa */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(role)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200/60 cursor-pointer"
                          title="Xóa vai trò này"
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
