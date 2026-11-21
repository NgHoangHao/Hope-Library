"use client";

import React, { useState, useEffect } from "react";
import { Bell, Menu, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { requestLogout } from "@/features/auth";
import { getAvatarUrl } from "@/features/profile";

interface DashboardTopbarProps {
  onToggleMobileMenu?: () => void;
  className?: string;
}

export function DashboardTopbar({ onToggleMobileMenu, className }: DashboardTopbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<{
    fullName?: string | null;
    username?: string;
    avatarUrl?: string | null;
    avartarUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = localStorage.getItem("hope_user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
    };

    loadUser();

    const handleUserUpdated = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      } else {
        loadUser();
      }
    };

    window.addEventListener("hope_user_updated", handleUserUpdated);
    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener("hope_user_updated", handleUserUpdated);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const handleLogout = () => {
    requestLogout();
  };

  return (
    <header
      className={cn(
        "w-full h-18 bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-20 px-6 sm:px-8 flex items-center justify-between border-b border-neutral-200/40",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors cursor-pointer"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Thông báo"
          className="relative p-2.5 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-white border border-neutral-200/60 shadow-2xs transition-all cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#F5B82E] rounded-full ring-2 ring-white" />
        </button>

        {/* User Button */}
        {user ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/profile")}
              title="Xem thông tin cá nhân"
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200/60 rounded-full shadow-2xs transition-colors cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-full bg-[#F5B82E] text-[#1A1A1A] font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                {user.avatarUrl || user.avartarUrl ? (
                  <img
                    src={getAvatarUrl(user.avatarUrl || user.avartarUrl) || ""}
                    alt={user.fullName || user.username || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user.fullName || user.username || "U")[0].toUpperCase()
                )}
              </div>
              <span className="text-xs font-semibold text-neutral-800 max-w-[120px] truncate">
                {user.fullName || user.username}
              </span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2.5 rounded-full text-neutral-500 hover:text-red-600 hover:bg-red-50 border border-neutral-200/60 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="px-4 py-2 rounded-full bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold border border-neutral-200/80 shadow-2xs transition-all cursor-pointer"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}
