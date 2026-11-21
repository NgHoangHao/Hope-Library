"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { registerApi } from "../services/authApi";
import { TopCornerAlert, HopeLogo } from "@/components/ui";

interface RegisterFormProps {
  onSuccess?: (email: string) => void;
  onNavigateLogin?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function RegisterForm({
  onSuccess,
  onNavigateLogin,
  onClose,
  isModal = false,
}: RegisterFormProps) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleGoToLogin = () => {
    if (onNavigateLogin) {
      onNavigateLogin();
    } else {
      router.push("/login");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      setErrorMessage("Vui lòng nhập tên đăng nhập");
      return;
    }

    if (trimmedUsername.length < 3) {
      setErrorMessage("Tên đăng nhập phải có ít nhất 3 ký tự");
      return;
    }

    if (!trimmedEmail) {
      setErrorMessage("Vui lòng nhập địa chỉ email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Địa chỉ email không đúng định dạng");
      return;
    }

    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!confirmPassword) {
      setErrorMessage("Vui lòng xác nhận lại mật khẩu");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsLoading(true);

    try {
      // Gọi API POST /auth/register
      const res = await registerApi({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        confirmPassword,
      });

      const confirmedEmail = res?.email || trimmedEmail;
      setSuccessMessage("Đăng ký thành công! Đang chuyển đến bước xác thực OTP...");

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(confirmedEmail);
        } else {
          router.push(`/verify-otp?email=${encodeURIComponent(confirmedEmail)}`);
        }
      }, 400);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Có lỗi xảy ra khi tạo tài khoản");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full bg-white rounded-3xl shadow-2xl p-7 sm:p-9 border border-neutral-100 transition-all duration-300">
      {/* Nút đóng [X] */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Đóng"
        className="absolute top-5 right-5 sm:top-6 sm:right-6 w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Brand Header */}
      <Link href="/" className="inline-flex items-center select-none mb-6 group">
        <HopeLogo size="md" variant="light" />
      </Link>

      {/* Tagline / Eyebrow */}
      <div className="text-[#C68A14] font-semibold text-[11px] tracking-[0.2em] uppercase mb-1.5">
        TRỞ THÀNH THÀNH VIÊN
      </div>

      {/* Heading */}
      <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-1">
        Tạo tài khoản
      </h2>

      {/* Subtitle */}
      <p className="text-neutral-500 text-xs sm:text-sm font-normal mb-6">
        Bắt đầu hành trình đọc sách cùng Hope.
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

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Username Field */}
        <div>
          <label
            htmlFor="register-username"
            className="block text-xs font-semibold text-neutral-800 mb-1"
          >
            Tên đăng nhập
          </label>
          <input
            id="register-username"
            type="text"
            autoComplete="username"
            disabled={isLoading}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="nguyenminhanh"
            className="w-full bg-[#FAF9F6] border border-neutral-200/90 rounded-xl px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all disabled:opacity-60"
          />
        </div>

        {/* Email Field */}
        <div>
          <label
            htmlFor="register-email"
            className="block text-xs font-semibold text-neutral-800 mb-1"
          >
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@example.com"
            className="w-full bg-[#FAF9F6] border border-neutral-200/90 rounded-xl px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all disabled:opacity-60"
          />
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-neutral-800 mb-1"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF9F6] border border-neutral-200/90 rounded-xl px-4 py-2.5 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="register-confirmpass"
            className="block text-xs font-semibold text-neutral-800 mb-1"
          >
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <input
              id="register-confirmpass"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isLoading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF9F6] border border-neutral-200/90 rounded-xl px-4 py-2.5 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-[#F5B82E] hover:bg-[#EAA91D] active:scale-[0.99] text-[#1A1A1A] font-semibold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang đăng ký...</span>
            </>
          ) : (
            <>
              <span>Đăng ký</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-5 text-center text-xs sm:text-sm text-neutral-500">
        Đã có tài khoản?{" "}
        {onNavigateLogin ? (
          <button
            type="button"
            onClick={handleGoToLogin}
            className="text-[#C68A14] font-semibold hover:underline cursor-pointer transition-colors"
          >
            Đăng nhập
          </button>
        ) : (
          <Link
            href="/login"
            className="text-[#C68A14] font-semibold hover:underline transition-colors"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </div>
  );
}
