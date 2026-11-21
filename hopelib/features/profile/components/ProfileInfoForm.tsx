"use client";

import React from "react";
import { User, Phone, Mail, Lock, Shield, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { UserProfile, ProfileFormValues, ProfileFormErrors } from "../types/profile.types";

export interface ProfileInfoFormProps {
  profile: UserProfile | null;
  formValues: ProfileFormValues;
  errors: ProfileFormErrors;
  isDirty: boolean;
  isUpdating: boolean;
  canUpdate: boolean;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onReset: () => void;
  onSubmit: () => Promise<boolean>;
}

export function ProfileInfoForm({
  profile,
  formValues,
  errors,
  isDirty,
  isUpdating,
  canUpdate,
  onFullNameChange,
  onPhoneChange,
  onReset,
  onSubmit,
}: ProfileInfoFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdate || !isDirty || isUpdating) return;
    await onSubmit();
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs">
      <div className="flex items-center justify-between pb-5 border-b border-neutral-100 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
            Thông tin chi tiết
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cập nhật họ tên hiển thị và số điện thoại liên hệ của bạn
          </p>
        </div>

        {isDirty && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Có thay đổi chưa lưu
          </span>
        )}
      </div>

      {!canUpdate && (
        <div className="mb-6 p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-neutral-600">
            <span className="font-semibold text-neutral-800">Chế độ chỉ xem: </span>
            Bạn không có quyền <code>USER_PROFILE_UPDATE</code> để chỉnh sửa thông tin cá nhân.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Họ và tên (Editable) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="profile-fullName"
                className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-neutral-400" />
                Họ và tên
              </label>
              <span className="text-[11px] text-neutral-400">
                {formValues.fullName.length}/100
              </span>
            </div>
            <div className="relative">
              <input
                id="profile-fullName"
                type="text"
                maxLength={100}
                value={formValues.fullName}
                onChange={(e) => onFullNameChange(e.target.value)}
                disabled={!canUpdate || isUpdating}
                placeholder="Nhập họ và tên đầy đủ..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${
                  errors.fullName
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20"
                    : "border-neutral-200/80 focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/20 bg-white"
                } ${!canUpdate ? "bg-neutral-50 cursor-not-allowed text-neutral-500" : "text-neutral-900"}`}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.fullName}</p>
            )}
          </div>

          {/* Số điện thoại (Editable) */}
          <div className="space-y-1.5">
            <label
              htmlFor="profile-phone"
              className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
              Số điện thoại
            </label>
            <div className="relative">
              <input
                id="profile-phone"
                type="tel"
                value={formValues.phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                disabled={!canUpdate || isUpdating}
                placeholder="Ví dụ: 0912345678 hoặc +84912345678"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${
                  errors.phone
                    ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 bg-rose-50/20"
                    : "border-neutral-200/80 focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/20 bg-white"
                } ${!canUpdate ? "bg-neutral-50 cursor-not-allowed text-neutral-500" : "text-neutral-900"}`}
              />
            </div>
            {errors.phone ? (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.phone}</p>
            ) : (
              <p className="text-[11px] text-neutral-400">Định dạng 10 số (bắt đầu bằng 0 hoặc +84)</p>
            )}
          </div>
        </div>

        {/* Thông tin chỉ đọc (Readonly fields) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-neutral-100">
          {/* Tên đăng nhập (Read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              Tên tài khoản (Username)
            </label>
            <div className="px-3.5 py-2.5 rounded-xl border border-neutral-200/60 bg-neutral-50 text-neutral-700 text-sm font-mono flex items-center justify-between">
              <span>{profile?.username || "—"}</span>
              <span className="text-[11px] text-neutral-400 font-sans">Cố định</span>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-neutral-400" />
              Địa chỉ Email
            </label>
            <div className="px-3.5 py-2.5 rounded-xl border border-neutral-200/60 bg-neutral-50 text-neutral-700 text-sm flex items-center justify-between">
              <span className="truncate">{profile?.email || "—"}</span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                Đã xác thực
              </span>
            </div>
          </div>
        </div>

        {/* Danh sách vai trò người dùng (Read-only) */}
        {((profile?.roleList || profile?.roleDetails)?.length || profile?.roles?.length || 0) > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-neutral-100">
            <label className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-neutral-400" />
              Vai trò trong hệ thống
            </label>
            <div className="p-3 rounded-xl border border-neutral-200/60 bg-neutral-50 flex flex-wrap gap-2">
              {(
                profile?.roleList ||
                profile?.roleDetails ||
                (profile?.roles?.map((r) => ({ id: r, name: r, description: null })) ?? [])
              ).map((r) => (
                <div
                  key={r.id || r.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-neutral-800 shadow-2xs"
                  title={r.description || undefined}
                >
                  <span className="font-semibold text-stone-900">{r.name}</span>
                  {r.description && (
                    <span className="text-neutral-500 text-[11px]">({r.description})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nút tác vụ (Actions) */}
        {canUpdate && (
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-neutral-100">
            <button
              type="button"
              onClick={onReset}
              disabled={!isDirty || isUpdating}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/70 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hủy thay đổi</span>
            </button>

            <button
              type="submit"
              disabled={!isDirty || isUpdating}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-stone-900 bg-[#F5B82E] hover:bg-amber-400 rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-stone-900/30 border-t-stone-900 rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
