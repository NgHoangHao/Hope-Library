"use client";

import React from "react";
import {
  Activity,
  Loader2,
  Clock,
  Eye,
  Globe,
  User as UserIcon,
} from "lucide-react";
import { AuditLogItem } from "../types/audit-log.types";
import { getAvatarUrl } from "@/features/profile";

export interface AuditLogTableProps {
  logs: AuditLogItem[];
  isLoading: boolean;
  page: number;
  size: number;
  onViewDetail: (log: AuditLogItem) => void;
}

/**
 * Hiển thị huy hiệu màu sắc tương ứng theo phương thức HTTP / Thao tác
 */
function getActionBadge(action: string) {
  const upper = (action || "").toUpperCase().trim();
  switch (upper) {
    case "GET":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200">
          GET
        </span>
      );
    case "POST":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
          POST
        </span>
      );
    case "PUT":
    case "PATCH":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
          {upper}
        </span>
      );
    case "DELETE":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
          DELETE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200">
          {upper || "UNKNOWN"}
        </span>
      );
  }
}

/**
 * Format thời gian đẹp mắt
 */
function formatLogDateTime(dateString: string) {
  if (!dateString) return "Chưa xác định";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * Rút gọn User-Agent để hiển thị ngắn gọn
 */
function formatShortUserAgent(userAgent?: string | null) {
  if (!userAgent) return "Không có thông tin";
  if (userAgent.includes("Chrome")) return "Google Chrome";
  if (userAgent.includes("Firefox")) return "Mozilla Firefox";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Apple Safari";
  if (userAgent.includes("Edge")) return "Microsoft Edge";
  if (userAgent.includes("Postman")) return "Postman Runtime";
  if (userAgent.includes("curl")) return "cURL CLI";
  return userAgent.length > 25 ? `${userAgent.slice(0, 25)}...` : userAgent;
}

export function AuditLogTable({
  logs,
  isLoading,
  page,
  size,
  onViewDetail,
}: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 flex flex-col items-center justify-center gap-3 text-stone-500 shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
        <span className="text-sm font-medium">Đang tải danh sách nhật ký hoạt động...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-stone-800">
          Không tìm thấy bản ghi nhật ký nào
        </h3>
        <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
          Không có hoạt động nào phù hợp với bộ lọc hiện tại hoặc hệ thống chưa ghi nhận nhật ký.
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
              <th scope="col" className="py-3.5 px-4 w-12 text-center">
                #
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[160px]">
                Thời gian
              </th>
              <th scope="col" className="py-3.5 px-4 w-28 text-center">
                Thao tác
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[200px]">
                Người thực hiện
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[240px]">
                Tài nguyên / Endpoint
              </th>
              <th scope="col" className="py-3.5 px-4 min-w-[160px]">
                Địa chỉ IP & Client
              </th>
              <th scope="col" className="py-3.5 px-4 w-24 text-right">
                Chi tiết
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
            {logs.map((log, index) => {
              const rowIndex = (page - 1) * size + index + 1;
              const userAvatar = getAvatarUrl(log.user?.avatarUrl);
              const userDisplayName = log.user?.fullName || log.user?.username || null;

              return (
                <tr
                  key={log.id}
                  className="hover:bg-amber-50/20 transition-colors group"
                >
                  {/* STT */}
                  <td className="py-3.5 px-4 text-center font-mono text-xs text-stone-400">
                    {rowIndex}
                  </td>

                  {/* Thời gian */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-stone-800 font-medium text-xs">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{formatLogDateTime(log.createdAt)}</span>
                    </div>
                  </td>

                  {/* Thao tác CRUD */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>

                  {/* Người thực hiện */}
                  <td className="py-3.5 px-4">
                    {log.user ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {userAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={userAvatar}
                              alt={userDisplayName || "Avatar"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate text-xs">
                            {userDisplayName}
                          </p>
                          <p className="text-[11px] text-stone-400 truncate">
                            {log.user.email || log.user.username}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-stone-400 text-xs">
                        <div className="w-8 h-8 rounded-full bg-stone-50 border border-dashed border-stone-200 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4 text-stone-300" />
                        </div>
                        <div>
                          <span className="font-medium text-stone-500">Khách / Hệ thống</span>
                          {log.userId && (
                            <span className="block text-[10px] font-mono text-stone-400 truncate max-w-[120px]">
                              {log.userId}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Tài nguyên / Endpoint */}
                  <td className="py-3.5 px-4">
                    <div className="max-w-[280px]">
                      <code className="px-2 py-1 rounded-md bg-stone-100 text-stone-800 font-mono text-[11px] block truncate border border-stone-200/60" title={log.targetResource}>
                        {log.targetResource || "/"}
                      </code>
                    </div>
                  </td>

                  {/* Địa chỉ IP & User Agent */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>
                      <span className="font-mono text-xs text-stone-800 block">
                        {log.ipAddress || "127.0.0.1"}
                      </span>
                      <span className="text-[11px] text-stone-400 block truncate max-w-[160px]" title={log.userAgent || undefined}>
                        {formatShortUserAgent(log.userAgent)}
                      </span>
                    </div>
                  </td>

                  {/* Thao tác xem chi tiết */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onViewDetail(log)}
                      title="Xem chi tiết nhật ký"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>Chi tiết</span>
                    </button>
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
