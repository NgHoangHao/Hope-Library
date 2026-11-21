"use client";

import React from "react";
import { Trash2, User, Loader2, ShieldCheck, Mail, Phone, Calendar } from "lucide-react";
import { AccountUser } from "../types/account.types";
import { getAvatarUrl } from "@/features/profile";

export interface AccountTableProps {
  accounts: AccountUser[];
  isLoading: boolean;
  page: number;
  size: number;
  canDelete: boolean;
  onDelete: (user: AccountUser) => void;
}

export function AccountTable({
  accounts,
  isLoading,
  page,
  size,
  canDelete,
  onDelete,
}: AccountTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 flex flex-col items-center justify-center gap-3 text-stone-500 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium">Đang tải danh sách tài khoản...</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Không tìm thấy tài khoản nào
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          Không có tài khoản nào phù hợp với bộ lọc hiện tại hoặc danh sách đang trống.
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
              <th scope="col" className="py-3.5 px-4 sm:px-6 w-14 text-center">
                STT
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 min-w-[220px]">
                Người dùng
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 min-w-[200px]">
                Thông tin liên hệ
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 min-w-[150px]">
                Vai trò
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 w-36 text-center">
                Trạng thái
              </th>
              <th scope="col" className="py-3.5 px-4 sm:px-6 w-36">
                Ngày tham gia
              </th>
              {canDelete && (
                <th scope="col" className="py-3.5 px-4 sm:px-6 w-24 text-right">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {accounts.map((user, index) => {
              const stt = (page - 1) * size + index + 1;
              const isActive = user.status?.toUpperCase() === "ACTIVE";
              const isLocked = user.status?.toUpperCase() === "LOCKED";
              const avatarSrc = getAvatarUrl(user.avatarUrl || user.avartarUrl);
              const initials = (user.fullName || user.username || "U")[0].toUpperCase();

              // Lấy danh sách tên vai trò
              const roleNames =
                user.roleList?.map((r) => r.name) ||
                user.roleDetails?.map((r) => r.name) ||
                user.roles ||
                [];

              const formattedDate = user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                : "—";

              return (
                <tr
                  key={user.id}
                  className="hover:bg-stone-50/80 transition-colors group"
                >
                  {/* STT */}
                  <td className="py-4 px-4 sm:px-6 text-center text-xs font-mono text-stone-400">
                    {stt}
                  </td>

                  {/* Thông tin người dùng */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-[#F5B82E] text-stone-950 font-bold text-sm flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={user.fullName || user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-stone-900 truncate">
                          {user.fullName || user.username}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono truncate">
                          <span>@{user.username}</span>
                          {user.code && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200/80">
                              {user.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Liên hệ */}
                  <td className="py-4 px-4 sm:px-6 text-xs text-stone-600 space-y-1">
                    <div className="flex items-center gap-1.5 truncate" title={user.email}>
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone ? (
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-300 italic pl-5">Chưa cập nhật SĐT</span>
                    )}
                  </td>

                  {/* Vai trò */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex flex-wrap gap-1">
                      {roleNames.length > 0 ? (
                        roleNames.map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                              role === "ADMIN"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : role === "LIBRARIAN"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400 italic">Thành viên</span>
                      )}
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-4 px-4 sm:px-6 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isLocked
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-stone-100 text-stone-600 border border-stone-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive
                            ? "bg-emerald-500 animate-pulse"
                            : isLocked
                            ? "bg-rose-500"
                            : "bg-stone-400"
                        }`}
                      />
                      {isActive ? "Hoạt động" : isLocked ? "Đã khóa" : "Tạm dừng"}
                    </span>
                  </td>

                  {/* Ngày tạo */}
                  <td className="py-4 px-4 sm:px-6 text-xs text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </td>

                  {/* Hành động Xóa (không có nút view detail theo yêu cầu) */}
                  {canDelete && (
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(user)}
                        title={`Xóa tài khoản ${user.username}`}
                        className="inline-flex items-center justify-center p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
