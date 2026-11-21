"use client";

import React, { useRef, useState } from "react";
import { Camera, Check, Copy, Upload, User, X, Calendar, Mail, ShieldAlert } from "lucide-react";
import { UserProfile } from "../types/profile.types";

export interface ProfileAvatarCardProps {
  profile: UserProfile | null;
  avatarPreview: string | null;
  avatarFile: File | null;
  avatarError?: string;
  canUpdate: boolean;
  onAvatarSelect: (file: File | null) => void;
  onRemoveSelectedAvatar: () => void;
}

export function ProfileAvatarCard({
  profile,
  avatarPreview,
  avatarFile,
  avatarError,
  canUpdate,
  onAvatarSelect,
  onRemoveSelectedAvatar,
}: ProfileAvatarCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [imageError, setImageError] = useState(false);

  const displayName = profile?.fullName || profile?.username || "Người dùng";
  const initials = (profile?.fullName || profile?.username || "U")[0].toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageError(false);
    onAvatarSelect(file);
    // Reset input value để có thể chọn lại cùng 1 file nếu muốn
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyId = () => {
    if (!profile?.id) return;
    navigator.clipboard.writeText(profile.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formattedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Chưa xác định";

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 border border-neutral-200/80 shadow-xs flex flex-col items-center text-center">
      {/* Vùng Avatar tròn */}
      <div className="relative group mb-4">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-amber-100 ring-offset-2 overflow-hidden bg-gradient-to-br from-amber-400 to-[#F5B82E] flex items-center justify-center text-stone-900 font-extrabold text-3xl sm:text-4xl shadow-md select-none relative">
          {avatarPreview && !imageError ? (
            <img
              src={avatarPreview}
              alt={displayName}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}

          {/* Overlay nút đổi ảnh khi hover */}
          {canUpdate && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
              title="Nhấn để đổi ảnh đại diện"
            >
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[11px] font-medium">Thay đổi</span>
            </button>
          )}
        </div>

        {/* Nút bấm Camera nhỏ góc dưới */}
        {canUpdate && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2.5 rounded-full bg-[#F5B82E] hover:bg-amber-400 text-stone-900 shadow-md ring-2 ring-white transition-transform hover:scale-110 cursor-pointer"
            title="Tải ảnh mới"
            aria-label="Tải ảnh đại diện mới"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={!canUpdate}
        />
      </div>

      {/* Cảnh báo lỗi file nếu có */}
      {avatarError && (
        <p className="text-xs text-rose-600 mb-2 font-medium">{avatarError}</p>
      )}

      {/* Thông báo đã chọn ảnh mới */}
      {avatarFile && (
        <div className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <Upload className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-medium truncate max-w-[160px]">{avatarFile.name}</span>
          <button
            type="button"
            onClick={onRemoveSelectedAvatar}
            className="text-neutral-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-white transition-colors cursor-pointer"
            title="Hủy chọn ảnh này"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Họ tên và username */}
      <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
        {displayName}
      </h2>
      <p className="text-xs text-neutral-400 font-mono mt-0.5">@{profile?.username}</p>

      {/* Vai trò */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
        {(profile?.roleList || profile?.roleDetails || (profile?.roles?.map((r) => ({ id: r, name: r, description: null })) ?? [])).length > 0 ? (
          (profile?.roleList || profile?.roleDetails || (profile?.roles?.map((r) => ({ id: r, name: r, description: null })) ?? [])).map((r) => (
            <span
              key={r.id || r.name}
              title={r.description || r.name}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200"
            >
              {r.name}
            </span>
          ))
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600">
            Thành viên
          </span>
        )}
      </div>

      {/* Phân cách */}
      <div className="w-full my-5 border-t border-neutral-100" />

      {/* Thông tin metadata tóm tắt */}
      <div className="w-full space-y-3 text-left text-xs">
        {/* Email */}
        <div className="flex items-center justify-between text-neutral-600 gap-2">
          <span className="flex items-center gap-2 text-neutral-400">
            <Mail className="w-3.5 h-3.5" /> Email:
          </span>
          <span className="font-medium text-neutral-800 truncate" title={profile?.email}>
            {profile?.email}
          </span>
        </div>

        {/* Ngày tạo tài khoản */}
        <div className="flex items-center justify-between text-neutral-600 gap-2">
          <span className="flex items-center gap-2 text-neutral-400">
            <Calendar className="w-3.5 h-3.5" /> Tham gia:
          </span>
          <span className="font-medium text-neutral-800">{formattedDate}</span>
        </div>

        {/* User ID */}
        <div className="flex items-center justify-between text-neutral-600 gap-2">
          <span className="text-neutral-400">Mã định danh:</span>
          <button
            type="button"
            onClick={handleCopyId}
            className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-600 hover:text-neutral-900 bg-neutral-100/70 hover:bg-neutral-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
            title="Nhấn để sao chép UUID"
          >
            <span className="truncate max-w-[110px]">{profile?.id}</span>
            {copiedId ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-neutral-400" />
            )}
          </button>
        </div>
      </div>

      {/* Gợi ý định dạng ảnh */}
      {canUpdate && (
        <div className="mt-5 pt-4 border-t border-neutral-100 w-full text-[11px] text-neutral-400 leading-relaxed">
          Cho phép PNG, JPG, JPEG, WEBP. Dung lượng tối đa 5MB.
        </div>
      )}
    </div>
  );
}
