"use client";

import React, { useState } from "react";
import {
  X,
  FileCode,
  User as UserIcon,
  Globe,
  Clock,
  Laptop,
  Copy,
  Check,
  Shield,
  Loader2,
} from "lucide-react";
import { AuditLogItem } from "../types/audit-log.types";
import { getAvatarUrl } from "@/features/profile";

export interface AuditLogDetailModalProps {
  isOpen: boolean;
  log: AuditLogItem | null;
  isLoading: boolean;
  onClose: () => void;
}

export function AuditLogDetailModal({
  isOpen,
  log,
  isLoading,
  onClose,
}: AuditLogDetailModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const userAvatar = getAvatarUrl(log?.user?.avatarUrl);
  const userDisplayName = log?.user?.fullName || log?.user?.username || "Chưa xác định";

  const getActionBadgeColor = (action: string) => {
    const upper = (action || "").toUpperCase().trim();
    switch (upper) {
      case "GET":
        return "bg-sky-50 text-sky-700 border-sky-300";
      case "POST":
        return "bg-emerald-50 text-emerald-700 border-emerald-300";
      case "PUT":
      case "PATCH":
        return "bg-amber-50 text-amber-700 border-amber-300";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-300";
      default:
        return "bg-stone-100 text-stone-700 border-stone-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center font-bold shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Chi tiết Nhật ký Kiểm toán
                </h2>
                {log && (
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                ID: {log?.id || "..."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#F5B82E]" />
              <span className="text-sm font-medium">Đang tải dữ liệu nhật ký...</span>
            </div>
          ) : !log ? (
            <div className="py-12 text-center text-stone-500 text-sm">
              Không tìm thấy thông tin nhật ký.
            </div>
          ) : (
            <>
              {/* Thẻ người thực hiện */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600">
                    <UserIcon className="w-4 h-4 text-amber-600" />
                    <span>Người thực hiện</span>
                  </div>
                  {log.userId && (
                    <button
                      type="button"
                      onClick={() => handleCopy(log.userId!, "userId")}
                      className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:underline cursor-pointer"
                    >
                      {copiedKey === "userId" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Đã chép User ID</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép ID</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {log.user ? (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-12 h-12 rounded-full bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {userAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={userAvatar}
                          alt={userDisplayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-6 h-6 text-stone-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 text-sm">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-stone-500 font-mono">
                        {log.user.email || log.user.username}
                      </p>
                      {log.user.phone && (
                        <p className="text-xs text-stone-400">
                          SĐT: {log.user.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-stone-500">
                    Thao tác được thực hiện bởi hệ thống hoặc người dùng chưa đăng nhập (Khách vãng lai).
                  </div>
                )}
              </div>

              {/* Thông tin yêu cầu (Request Metadata) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-stone-200/80 bg-white space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="font-medium text-[11px] uppercase tracking-wider">
                      Thời điểm thực hiện
                    </span>
                  </div>
                  <p className="font-semibold text-stone-800">
                    {new Date(log.createdAt).toLocaleString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono">
                    {log.createdAt}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200/80 bg-white space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="font-medium text-[11px] uppercase tracking-wider">
                      Địa chỉ IP máy khách
                    </span>
                  </div>
                  <p className="font-mono font-bold text-stone-800">
                    {log.ipAddress || "127.0.0.1"}
                  </p>
                </div>
              </div>

              {/* Endpoint mục tiêu */}
              <div className="p-3.5 rounded-xl border border-stone-200/80 bg-white space-y-1.5">
                <span className="block font-medium text-[11px] text-stone-400 uppercase tracking-wider">
                  Tài nguyên / Endpoint URL
                </span>
                <div className="flex items-center justify-between gap-2 bg-stone-50 px-3 py-2 rounded-lg border border-stone-200">
                  <code className="font-mono text-xs text-stone-900 break-all">
                    {log.targetResource || "/"}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(log.targetResource, "resource")}
                    className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded transition-colors shrink-0"
                    title="Sao chép Endpoint"
                  >
                    {copiedKey === "resource" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* User Agent */}
              {log.userAgent && (
                <div className="p-3.5 rounded-xl border border-stone-200/80 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Laptop className="w-3.5 h-3.5" />
                    <span className="font-medium text-[11px] uppercase tracking-wider">
                      User Agent (Trình duyệt / Thiết bị)
                    </span>
                  </div>
                  <p className="text-xs font-mono text-stone-700 break-all bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                    {log.userAgent}
                  </p>
                </div>
              )}

              {/* Dữ liệu chi tiết (Details JSON) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 uppercase tracking-wider">
                    <FileCode className="w-4 h-4 text-amber-600" />
                    <span>Dữ liệu chi tiết (Details Payload)</span>
                  </div>

                  {log.details && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(JSON.stringify(log.details, null, 2), "detailsJson")
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline cursor-pointer"
                    >
                      {copiedKey === "detailsJson" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã sao chép JSON</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép JSON</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {log.details && Object.keys(log.details).length > 0 ? (
                  <pre className="p-4 rounded-2xl bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto max-h-64 leading-relaxed border border-stone-800">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                ) : (
                  <div className="p-6 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-400">
                    Bản ghi này không có thêm trường dữ liệu bổ sung trong mục details.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between">
          <div>
            {log && (
              <button
                type="button"
                onClick={() => handleCopy(log.id, "logId")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                {copiedKey === "logId" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã sao chép Log ID</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép Log ID</span>
                  </>
                )}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
