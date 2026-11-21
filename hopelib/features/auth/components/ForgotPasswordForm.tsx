"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { forgotPasswordApi } from "../services/authApi";
import { TopCornerAlert, HopeLogo } from "@/components/ui";

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void;
  onBackToLogin?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function ForgotPasswordForm({
  onSuccess,
  onBackToLogin,
  onClose,
  isModal = false,
}: ForgotPasswordFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
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

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Vui lòng nhập email nhận mã OTP");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Địa chỉ email không đúng định dạng");
      return;
    }

    setIsLoading(true);

    try {
      const result = await forgotPasswordApi({ email: trimmedEmail });
      setSuccessMessage(
        result?.message ||
          "Mã OTP xác thực đã được gửi về email của bạn (hiệu lực 5 phút). Vui lòng kiểm tra hộp thư."
      );

      if (onSuccess) {
        onSuccess(trimmedEmail);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Không thể gửi mã OTP vào lúc này. Vui lòng thử lại sau.");
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
        KHÔI PHỤC TÀI KHOẢN
      </div>

      {/* Heading */}
      <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
        Quên mật khẩu?
      </h2>

      {/* Subtitle */}
      <p className="text-neutral-500 text-xs sm:text-sm font-normal leading-relaxed mb-6">
        Nhập email đã đăng ký. Hope Library sẽ gửi mã OTP để xác minh tài khoản của bạn.
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

      {/* Forgot Password Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-xs font-semibold text-neutral-800 mb-1.5"
          >
            Email nhận mã OTP
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@example.com"
            className="w-full bg-[#FAF9F6] border border-neutral-200/90 rounded-xl px-4 py-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all disabled:opacity-60"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#F5B82E] hover:bg-[#EAA91D] active:scale-[0.99] text-[#1A1A1A] font-semibold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang gửi mã...</span>
            </>
          ) : (
            <>
              <span>Gửi mã OTP</span>
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
