"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { isImeKeyEvent } from "@/lib/ime";
import { HopeLogo } from "@/components/ui";
import {
  verifyOtpApi,
  resendOtpApi,
  verifyResetOtpApi,
  forgotPasswordApi,
} from "../services/authApi";
import { TopCornerAlert } from "@/components/ui";

export interface OtpVerificationFormProps {
  email: string;
  mode?: "register" | "reset-password";
  onSuccess?: (resetToken?: string) => void;
  onClose?: () => void;
  onBackToLogin?: () => void;
  isModal?: boolean;
}

export function OtpVerificationForm({
  email,
  mode = "register",
  onSuccess,
  onClose,
  onBackToLogin,
  isModal = false,
}: OtpVerificationFormProps) {
  const router = useRouter();

  // 6 ô ký tự OTP
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Đếm ngược gửi lại OTP (mặc định 60 giây)
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus ô đầu tiên khi mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/");
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    // Chỉ chấp nhận số
    const cleanVal = value.replace(/[^0-9]/g, "");
    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    const newDigits = [...otpDigits];
    // Lấy ký tự cuối cùng vừa nhập
    newDigits[index] = cleanVal.slice(-1);
    setOtpDigits(newDigits);

    // Tự động nhảy ô tiếp theo
    if (index < 5 && newDigits[index]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isImeKeyEvent(e.nativeEvent)) return;
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || "";
    }
    setOtpDigits(newDigits);

    // Focus ô cuối cùng được điền hoặc ô tiếp theo
    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      setErrorMessage("Vui lòng nhập đầy đủ 6 chữ số mã OTP");
      return;
    }

    if (!email) {
      setErrorMessage("Không tìm thấy thông tin email đăng ký");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "reset-password") {
        // Gọi API POST /auth/verify-reset-otp
        const result = await verifyResetOtpApi({
          email,
          otp: fullOtp,
        });

        setSuccessMessage("Xác thực OTP thành công! Đang chuyển đến màn hình đặt lại mật khẩu...");

        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result.resetToken);
          } else {
            router.push("/login");
          }
        }, 800);
      } else {
        // Gọi API POST /auth/verify-otp (Đăng ký tài khoản)
        await verifyOtpApi({
          email,
          otp: fullOtp,
        });

        setSuccessMessage("Xác thực OTP thành công! Tài khoản của bạn đã được kích hoạt.");

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/login");
          }
        }, 1200);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Mã OTP không hợp lệ hoặc đã hết hạn");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isResending || !email) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      if (mode === "reset-password") {
        // Gọi API POST /auth/forgot-password để gửi lại mã OTP đặt lại mật khẩu
        await forgotPasswordApi({ email });
        setSuccessMessage("Mã OTP khôi phục mới đã được gửi lại vào email của bạn (hiệu lực 5 phút)");
      } else {
        // Gọi API POST /auth/resend-otp (Đăng ký tài khoản)
        await resendOtpApi({ email });
        setSuccessMessage("Mã OTP mới đã được gửi lại vào email của bạn (hiệu lực 5 phút)");
      }
      setCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
      }
    } finally {
      setIsResending(false);
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
        {mode === "reset-password" ? "KHÔI PHỤC MẬT KHẨU" : "XÁC THỰC BẢO MẬT"}
      </div>

      {/* Heading */}
      <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-2">
        {mode === "reset-password" ? "Xác thực mã OTP" : "Nhập mã OTP"}
      </h2>

      {/* Subtitle */}
      <p className="text-neutral-500 text-xs sm:text-sm font-normal mb-6">
        {mode === "reset-password" ? (
          <>
            Mã OTP 6 chữ số đã được gửi đến{" "}
            <span className="font-semibold text-neutral-800 break-all">{email}</span> để đặt lại
            mật khẩu
          </>
        ) : (
          <>
            Mã gồm 6 chữ số đã được gửi đến{" "}
            <span className="font-semibold text-neutral-800 break-all">{email || "email của bạn"}</span>
          </>
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

      {/* OTP Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 6 OTP Inputs */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={isLoading}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold text-neutral-900 bg-[#FAF9F6] border border-neutral-200/90 rounded-xl focus:outline-none focus:border-[#F5B82E] focus:ring-2 focus:ring-[#F5B82E]/30 focus:bg-white transition-all disabled:opacity-60"
            />
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || otpDigits.some((d) => !d)}
          className="w-full bg-[#F5B82E] hover:bg-[#EAA91D] active:scale-[0.99] text-[#1A1A1A] font-semibold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác nhận...</span>
            </>
          ) : (
            <>
              <span>Xác nhận OTP</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Resend OTP */}
      <div className="mt-6 text-center text-xs sm:text-sm text-neutral-500">
        Chưa nhận được mã?{" "}
        {countdown > 0 ? (
          <span className="text-[#C68A14] font-semibold">
            Gửi lại sau {countdown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending}
            className="text-[#C68A14] font-semibold hover:underline cursor-pointer transition-colors disabled:opacity-60"
          >
            {isResending ? "Đang gửi lại..." : "Gửi lại ngay"}
          </button>
        )}
      </div>

      {/* Back to Login link */}
      {onBackToLogin && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs text-neutral-500 hover:text-neutral-800 hover:underline cursor-pointer"
          >
            Quay lại đăng nhập
          </button>
        </div>
      )}
    </div>
  );
}
