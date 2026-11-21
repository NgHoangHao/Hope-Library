"use client";

import React, { useState, useRef } from "react";
import { UserPlus, X, Eye, EyeOff, Loader2, Upload, Trash2 } from "lucide-react";
import { CreateAccountInput, AccountRoleItem } from "../types/account.types";

export interface AccountCreateModalProps {
  isOpen: boolean;
  isCreating: boolean;
  availableRoles: AccountRoleItem[];
  onClose: () => void;
  onCreate: (input: CreateAccountInput) => Promise<boolean>;
}

export function AccountCreateModal({
  isOpen,
  isCreating,
  availableRoles,
  onClose,
  onCreate,
}: AccountCreateModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("BORROWER");
  const [status, setStatus] = useState("ACTIVE");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Chỉ hỗ trợ file ảnh PNG, JPG, JPEG, WEBP.",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        avatar: "Kích thước ảnh không được vượt quá 5MB.",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, avatar: "" }));
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!username.trim()) {
      errs.username = "Tên tài khoản không được để trống.";
    } else if (username.trim().length < 3) {
      errs.username = "Tên tài khoản phải có ít nhất 3 ký tự.";
    }

    if (!email.trim()) {
      errs.email = "Email không được để trống.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = "Email không đúng định dạng.";
      }
    }

    if (!password) {
      errs.password = "Mật khẩu không được để trống.";
    } else if (password.length < 6) {
      errs.password = "Mật khẩu phải có tối thiểu 6 ký tự.";
    }

    if (phone.trim()) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(phone.trim())) {
        errs.phone = "Số điện thoại không đúng định dạng (Ví dụ: 0912345678).";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isCreating) return;

    const success = await onCreate({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim() || undefined,
      phone: phone.trim() || undefined,
      role,
      roles: [role],
      status,
      avatarFile: avatarFile || undefined,
    });

    if (success) {
      // Reset form
      setUsername("");
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
      setRole("BORROWER");
      setStatus("ACTIVE");
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setErrors({});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-[#B8860B] flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Thêm tài khoản mới</h3>
              <p className="text-xs text-stone-500">Tạo tài khoản và phân quyền người dùng trong hệ thống</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar upload */}
          <div className="flex items-center gap-4 p-3 bg-stone-50/80 rounded-2xl border border-stone-100">
            <div className="relative w-14 h-14 rounded-2xl bg-stone-200 border-2 border-dashed border-stone-300 overflow-hidden flex items-center justify-center shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload className="w-5 h-5 text-stone-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer shadow-2xs"
                >
                  {avatarFile ? "Thay đổi ảnh" : "Chọn ảnh đại diện"}
                </button>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Xóa ảnh đã chọn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-stone-400 mt-1 truncate">
                {avatarFile ? avatarFile.name : "Hỗ trợ PNG, JPG, WEBP (tối đa 5MB)"}
              </p>
              {errors.avatar && (
                <p className="text-[11px] text-rose-600 font-medium mt-0.5">{errors.avatar}</p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Tên tài khoản <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors((prev) => ({ ...prev, username: "" }));
                }}
                placeholder="Ví dụ: nguyenvana"
                className={`w-full px-3.5 py-2 rounded-xl text-sm border bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40 ${
                  errors.username ? "border-rose-400 bg-rose-50/30" : "border-stone-200"
                }`}
              />
              {errors.username && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                placeholder="nguyenvana@gmail.com"
                className={`w-full px-3.5 py-2 rounded-xl text-sm border bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40 ${
                  errors.email ? "border-rose-400 bg-rose-50/30" : "border-stone-200"
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full pl-3.5 pr-10 py-2 rounded-xl text-sm border bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40 ${
                  errors.password ? "border-rose-400 bg-rose-50/30" : "border-stone-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.password}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                placeholder="0912345678"
                className={`w-full px-3.5 py-2 rounded-xl text-sm border bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40 ${
                  errors.phone ? "border-rose-400 bg-rose-50/30" : "border-stone-200"
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Vai trò</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40 cursor-pointer"
              >
                {availableRoles.length > 0 ? (
                  availableRoles.map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="BORROWER">BORROWER</option>
                    <option value="LIBRARIAN">LIBRARIAN</option>
                    <option value="ADMIN">ADMIN</option>
                  </>
                )}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F5B82E]/40 cursor-pointer"
              >
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="INACTIVE">Không hoạt động (INACTIVE)</option>
                <option value="LOCKED">Bị khóa (LOCKED)</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-stone-950 bg-[#F5B82E] hover:bg-amber-400 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <span>Tạo tài khoản</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
