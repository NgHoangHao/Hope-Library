"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LoginForm, AuthUser, extractRoles, getPostLoginRedirectUrl } from "@/features/auth";

export default function LoginPage() {
  const router = useRouter();

  /**
   * Xử lý sau khi người dùng đăng nhập thành công qua api /auth/login:
   * - Lấy danh sách roles (từ user object hoặc giải mã từ JWT token).
   * - Nếu danh sách role tồn tại ADMIN hoặc LIBRARIAN -> ưu tiên điều hướng qua Dashboard (/dashboard).
   * - Nếu chỉ có role là BORROWER -> điều hướng qua Home (/home).
   */
  const handleLoginSuccess = (user?: AuthUser, token?: string) => {
    const roles = extractRoles(user, token);
    const redirectUrl = getPostLoginRedirectUrl(user, token);

    console.log("[LoginPage] Đăng nhập thành công:", {
      username: user?.username,
      roles,
      redirectUrl,
    });

    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 500);
  };

  return (
    <LoginForm
      isModal={false}
      onSuccess={handleLoginSuccess}
      onForgotPassword={() => router.push("/forgot-password")}
    />
  );
}
