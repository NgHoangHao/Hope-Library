"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser } from "../types/auth.types";
import { requestLogout } from "../components/LogoutConfirmModal";
import { SESSION_EXPIRED_EVENT } from "../services/apiClient";

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

  // Đồng bộ user từ localStorage khi mount / khi Next.js Activity khôi phục route cache
  useEffect(() => {
    const syncUserFromStorage = () => {
      try {
        const token = localStorage.getItem("hope_access_token");
        const storedUser = localStorage.getItem("hope_user");
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    syncUserFromStorage();

    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("login") === "true") {
          setIsLoginOpen(true);
        }
      }
    } catch {
      // Bỏ qua lỗi đọc query param nếu có
    }

    const handleUserUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<AuthUser | null | undefined>;
      if (customEvent.detail === null) {
        setUser(null);
      } else if (customEvent.detail) {
        setUser(customEvent.detail);
      } else {
        syncUserFromStorage();
      }
    };

    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener("storage", syncUserFromStorage);
    window.addEventListener("hope_user_updated", handleUserUpdated);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener("storage", syncUserFromStorage);
      window.removeEventListener("hope_user_updated", handleUserUpdated);
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
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
