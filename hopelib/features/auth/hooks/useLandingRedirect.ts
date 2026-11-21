"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPostLoginRedirectUrl, extractRoles } from "../utils/auth.helper";

export interface UseLandingRedirectReturn {
  isChecking: boolean;
}

/**
 * Hook kiểm tra trạng thái đăng nhập cho Landing Page (/):
 * - Nếu người dùng đã đăng nhập:
 *   + Tồn tại vai trò ADMIN hoặc LIBRARIAN -> tự động điều hướng sang /dashboard
 *   + Chỉ có vai trò BORROWER -> tự động điều hướng sang /home
 * - Nếu chưa đăng nhập: giữ người dùng ở lại trang Landing để hiển thị nút Đăng nhập.
 */
export function useLandingRedirect(): UseLandingRedirectReturn {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("hope_access_token");
      const storedUser = localStorage.getItem("hope_user");

      if (token || storedUser) {
        let user: unknown = undefined;
        if (storedUser) {
          try {
            user = JSON.parse(storedUser);
          } catch {
            // ignore
          }
        }

        const roles = extractRoles(user, token || undefined);
        if (roles.length > 0) {
          const redirectUrl = getPostLoginRedirectUrl(user, token || undefined);
          router.replace(redirectUrl);
          return;
        }
      }
    } catch (err) {
      console.warn("[useLandingRedirect] Lỗi kiểm tra phiên đăng nhập:", err);
    } finally {
      setIsChecking(false);
    }
  }, [router]);

  return { isChecking };
}
