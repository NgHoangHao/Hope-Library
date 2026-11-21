"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { resetPasswordApi } from "../services/authApi";
import { TopCornerAlert, HopeLogo } from "@/components/ui";

export interface ResetPasswordFormProps {
  resetToken: string;
  email?: string;
  onSuccess?: () => void;
  onClose?: () => void;
  onBackToLogin?: () => void;
  isModal?: boolean;
}

export function ResetPasswordForm({
  resetToken,
  email,
  onSuccess,
  onClose,
  onBackToLogin,
  isModal = false,
}: ResetPasswordFormProps) {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/");
    }
  };

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      router.push("/login");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetToken) {
      setErrorMessage("Reset token không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ đầu.");
      return;
    }

    if (!newPassword) {
      setErrorMessage("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu mới phải có tối thiểu 6 ký tự");
      return;
    }

    if (!confirmPassword) {
      setErrorMessage("Vui lòng xác nhận mật khẩu mới");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Xác nhận mật khẩu mới không trùng khớp");
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordApi({
        resetToken,
        newPassword,
        confirmPassword,
      });

      setSuccessMessage("Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...");

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/login");
        }
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Không thể đặt lại mật khẩu. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full bg-white rounded-3xl shadow-2xl p-7 sm:p-9 border border-neutral-100 transition-all duration-300">
      {/* Nút đóng [X] */}
      {(isModal || onClose) && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng"
          className="absolute top-5 right-5 sm:top-6 sm:right-6 w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Brand Header */}
      <Link href="/" className="inline-flex items-center select-none mb-6 group">
        <HopeLogo size="md" variant="light" />
      </Link>

      {/* Tagline / Eyebrow */}
      <div className="text-[#C68A14] font-semibold text-[11px] tracking-[0.2em] uppercase mb-1.5">
        ĐẶT LẠI MẬT KHẨU
      </div>

      {/* Heading */}
      <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
        Tạo mật khẩu mới
      </h2>

      {/* Subtitle */}
      <p className="text-neutral-500 text-xs sm:text-sm font-normal leading-relaxed mb-6">
        {email ? (
          <>
            Đang đặt lại mật khẩu cho tài khoản{" "}
            <span className="font-semibold text-neutral-800 break-all">{email}</span>. Vui lòng
            nhập mật khẩu mới từ 6 ký tự trở lên.
          </>
        ) : (
          "Vui lòng nhập mật khẩu mới có tối thiểu 6 ký tự để bảo vệ tài khoản của bạn."
        )}
      </p>

      {/* Thông báo dạng Alert nổi góc trên màn hình đồng bộ */}
      <TopCornerAlert
        feedback={
          errorMessage
            ? { type: "error", message: errorMessage }
            : successMessage
            ? { type: "success", message: successMessage }
            : null
        }
        onClose={() => {
          setErrorMessage(null);
          setSuccessMessage(null);
        }}
      />

      {/* Form Reset Password */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mật khẩu mới */}
        <div>
          <label
            htmlFor="new-password"
            className="block text-xs font-semibold text-neutral-800 mb-1.5"
          >
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isLoading}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF9F6] border border-neutral-200/90 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all pr-11 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1 cursor-pointer"
              aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Xác nhận mật khẩu mới */}
        <div>
          <label
            htmlFor="confirm-new-password"
            className="block text-xs font-semibold text-neutral-800 mb-1.5"
          >
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="confirm-new-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isLoading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF9F6] border border-neutral-200/90 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all pr-11 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1 cursor-pointer"
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#F5B82E] hover:bg-[#EAA91D] active:scale-[0.99] text-[#1A1A1A] font-semibold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang lưu mật khẩu...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Lưu mật khẩu mới</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Back to Login */}
      <div className="mt-6 text-center">
        {onBackToLogin ? (
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-xs sm:text-sm font-semibold text-neutral-800 hover:text-black transition-colors cursor-pointer"
          >
            Quay lại đăng nhập
          </button>
        ) : (
          <Link
            href="/login"
            className="text-xs sm:text-sm font-semibold text-neutral-800 hover:text-black transition-colors"
          >
            Quay lại đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
}
