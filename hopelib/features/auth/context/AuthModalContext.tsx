"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser } from "../types/auth.types";
import { clearStoredPermissions } from "../utils/permission.helper";
import { requestLogout } from "../components/LogoutConfirmModal";

interface AuthModalContextType {
  isLoginOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Khôi phục user từ localStorage khi tải trang và kiểm tra query param ?login=true
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("hope_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("login") === "true") {
          setIsLoginOpen(true);
        }
      }
    } catch {
      // Bỏ qua lỗi parsing nếu có
    }

    const handleStorageChange = () => {
      try {
        const storedUser = localStorage.getItem("hope_user");
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);

  const logout = () => {
    requestLogout();
  };

  return (
    <AuthModalContext.Provider
      value={{
        isLoginOpen,
        openLogin,
        closeLogin,
        user,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
