"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { extractRoles, hasDashboardRole } from "../utils/auth.helper";

export interface UseBorrowerHomeGuardReturn {
  isAuthorized: boolean;
  isLoading: boolean;
}

/**
 * Hook bảo vệ route /home dành cho giao diện Độc giả (BORROWER):
 * - Nếu chưa đăng nhập: chuyển hướng về Landing Page (/).
 * - Nếu tài khoản chứa quyền ADMIN hoặc LIBRARIAN: chuyển hướng sang /dashboard.
 * - Nếu chỉ có role BORROWER: cho phép truy cập.
 */
export function useBorrowerHomeGuard(): UseBorrowerHomeGuardReturn {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("hope_access_token");
      const storedUser = localStorage.getItem("hope_user");

      if (!token) {
        // Chưa đăng nhập -> điều hướng về trang landing
        router.replace("/");
        return;
      }

      let user: unknown = undefined;
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch {
          // ignore
        }
      }

      // Nếu có vai trò ADMIN hoặc LIBRARIAN -> ưu tiên điều hướng qua /dashboard
      if (hasDashboardRole(user, token)) {
        const currentPath = window.location.pathname;
        if (currentPath === "/profile" || currentPath.startsWith("/profile/")) {
          router.replace("/dashboard/profile");
        } else {
          router.replace("/dashboard");
        }
        return;
      }

      setIsAuthorized(true);
    } catch (err) {
      console.warn("[useBorrowerHomeGuard] Lỗi kiểm tra quyền hạn độc giả:", err);
      router.replace("/");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return { isAuthorized, isLoading };
}
