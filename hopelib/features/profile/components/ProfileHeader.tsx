"use client";

import React from "react";
import { UserCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { TopCornerAlert, AlertFeedback } from "@/components/ui";
import { UserProfile } from "../types/profile.types";

export interface ProfileHeaderProps {
  profile: UserProfile | null;
  isLoading: boolean;
  feedback: AlertFeedback | null;
  onClearFeedback: () => void;
  onRefresh: () => void;
}

export function ProfileHeader({
  profile,
  isLoading,
  feedback,
  onClearFeedback,
  onRefresh,
}: ProfileHeaderProps) {
  const isActive = profile?.status?.toUpperCase() === "ACTIVE";

  return (
    <div className="space-y-4">
      {/* Toast Alert thông báo góc phải trên */}
      <TopCornerAlert feedback={feedback} onClose={onClearFeedback} />

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5B82E] to-amber-600 flex items-center justify-center text-stone-950 shadow-xs shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  Hồ sơ cá nhân
                </h1>
                {profile && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      }`}
                    />
                    {isActive ? "Tài khoản hoạt động" : "Đã khóa"}
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 mt-1">
                Xem và quản lý thông tin tài khoản, ảnh đại diện và chi tiết liên hệ của bạn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {((profile?.roleList || profile?.roleDetails)?.length || profile?.roles?.length || 0) > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-800 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
                <span>
                  {(profile?.roleList || profile?.roleDetails)
                    ? (profile?.roleList || profile?.roleDetails)!.map((r) => r.name).join(", ")
                    : profile?.roles?.join(", ")}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Làm mới thông tin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
