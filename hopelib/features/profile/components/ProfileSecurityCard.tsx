"use client";

import React from "react";
import { Shield, KeyRound, CheckCircle2, Lock } from "lucide-react";
import { UserProfile } from "../types/profile.types";

export interface ProfileSecurityCardProps {
  profile: UserProfile | null;
}

export function ProfileSecurityCard({ profile }: ProfileSecurityCardProps) {
  const roleList =
    profile?.roleList ||
    profile?.roleDetails ||
    (profile?.roles?.map((r) => ({ id: r, name: r, description: null })) ?? []);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-neutral-200/80 shadow-xs space-y-5">
      <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-neutral-900">Bảo mật & Quyền hạn</h3>
          <p className="text-xs text-neutral-500">Tổng quan tình trạng vai trò và bảo mật tài khoản</p>
        </div>
      </div>

      {/* Danh sách vai trò chi tiết */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-neutral-700 block">
          Danh sách vai trò tài khoản ({roleList.length}):
        </span>
        <div className="space-y-2">
          {roleList.length > 0 ? (
            roleList.map((r) => (
              <div
                key={r.id || r.name}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col gap-1 text-left"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white text-stone-800 border border-stone-200 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {r.name === "ADMIN"
                      ? "Quản trị viên (ADMIN)"
                      : r.name === "LIBRARIAN"
                      ? "Thủ thư (LIBRARIAN)"
                      : r.name === "BORROWER"
                      ? "Độc giả / Bạn đọc (BORROWER)"
                      : r.name}
                  </span>
                  {r.id && (
                    <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[140px]">
                      ID: {r.id}
                    </span>
                  )}
                </div>
                {r.description && (
                  <p className="text-xs text-neutral-600 pl-1 mt-0.5">
                    {r.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <span className="text-xs text-neutral-400">Chưa được cấp vai trò</span>
          )}
        </div>
      </div>

      {/* Lưu ý bảo mật */}
      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 space-y-2 text-xs text-neutral-600">
        <div className="flex items-center gap-2 font-semibold text-neutral-800">
          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
          <span>Khuyến nghị bảo mật</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-500 leading-relaxed">
          <li>Mật khẩu của bạn được mã hóa an toàn trên máy chủ.</li>
          <li>Không chia sẻ tài khoản hoặc mật khẩu với bất kỳ ai.</li>
          <li>Nếu bạn quên mật khẩu, hãy dùng tính năng Quên mật khẩu tại trang đăng nhập.</li>
        </ul>
      </div>
    </div>
  );
}
