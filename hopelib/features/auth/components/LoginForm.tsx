"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { loginApi } from "../services/authApi";
import { AuthUser } from "../types/auth.types";
import { hasDashboardRole, getPostLoginRedirectUrl } from "../utils/auth.helper";
import { fetchAndStorePermissions } from "../utils/permission.helper";
import { TopCornerAlert, HopeLogo } from "@/components/ui";

interface LoginFormProps {
  onSuccess?: (user?: AuthUser, token?: string) => void;
  onForgotPassword?: () => void;
  onNavigateRegister?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function LoginForm({
  onSuccess,
  onForgotPassword,
  onNavigateRegister,
  onClose,
  isModal = false,
}: LoginFormProps) {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      router.push("/forgot-password");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim()) {
      setErrorMessage("Vui lòng nhập Email hoặc Tên đăng nhập");
      return;
    }

    if (!password) {
      setErrorMessage("Vui lòng nhập Mật khẩu");
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginApi({
        username: username.trim(),
        password,
      });

      if (data.accessToken) {
        localStorage.setItem("hope_access_token", data.accessToken);
      }
      if (data.user) {
        localStorage.setItem("hope_user", JSON.stringify(data.user));
      }

      // Lấy danh sách permission theo vai trò của người dùng khi đăng nhập thành công
      try {
        await fetchAndStorePermissions(data.accessToken);
      } catch (permError) {
        console.warn("[LoginForm] Không thể đồng bộ quyền hạn:", permError);
      }

      setSuccessMessage("Đăng nhập thành công!");

      if (onSuccess) {
        onSuccess(data.user, data.accessToken);
      } else {
        const redirectUrl = getPostLoginRedirectUrl(data.user, data.accessToken);

        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 800);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Có lỗi xảy ra trong quá trình đăng nhập");
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
        CHÀO MỪNG TRỞ LẠI
      </div>

      {/* Heading */}
      <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-1">
        Đăng nhập
      </h2>

      {/* Subtitle */}
      <p className="text-neutral-500 text-xs sm:text-sm font-normal mb-6">
        Quản lý hành trình tri thức của bạn.
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label
            htmlFor="login-email-input"
            className="block text-xs font-semibold text-neutral-800 mb-1.5"
          >
            Username
          </label>
          <input
            id="login-email-input"
            type="text"
            autoComplete="username"
            disabled={isLoading}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="w-full bg-[#FAF9F6] border border-neutral-200/90 rounded-xl px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all disabled:opacity-60"
          />
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password-input"
              className="block text-xs font-semibold text-neutral-800"
            >
              Mật khẩu
            </label>
            {/* Link Quên mật khẩu */}
            {onForgotPassword ? (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-[#C68A14] hover:underline cursor-pointer transition-colors"
              >
                Quên mật khẩu?
              </button>
            ) : (
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[#C68A14] hover:underline transition-colors"
              >
                Quên mật khẩu?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              id="login-password-input"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF9F6] border border-neutral-200/90 rounded-xl px-4 py-3 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all disabled:opacity-60"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-[#F5B82E] hover:bg-[#EAA91D] active:scale-[0.99] text-[#1A1A1A] font-semibold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center text-xs sm:text-sm text-neutral-500">
        Chưa có tài khoản?{" "}
        {onNavigateRegister ? (
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-[#C68A14] font-semibold hover:underline cursor-pointer transition-colors"
          >
            Đăng ký ngay
          </button>
        ) : (
          <Link
            href="/register"
            className="text-[#C68A14] font-semibold hover:underline transition-colors"
          >
            Đăng ký ngay
          </Link>
        )}
      </div>
    </div>
  );
}
