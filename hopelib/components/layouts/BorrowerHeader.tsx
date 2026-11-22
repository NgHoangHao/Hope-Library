"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HopeLogo } from "@/components/ui";
import {
  User as UserIcon,
  LogOut,
  BookMarked,
  Home,
  BookOpen,
  ClipboardList,
  Menu,
  X,
} from "lucide-react";
import { requestLogout, getMeApi, AuthUser, usePermissions } from "@/features/auth";
import { getAvatarUrl } from "@/features/profile";
import {
  BorrowerRemainingBooksCard,
  useRemainingBorrowBooks,
} from "@/features/loan";

export function BorrowerHeader() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const {
    maxBorrowBooks,
    borrowedBooksCount,
    remainingBorrowBooks,
    isLoading: isLoadingQuota,
  } = useRemainingBorrowBooks();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [imageError, setImageError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const token = localStorage.getItem("hope_access_token");
        const stored = localStorage.getItem("hope_user");

        if (!token) {
          if (isMounted) {
            setUser(null);
            setImageError(false);
          }
          return;
        }

        if (stored) {
          const parsed = JSON.parse(stored);
          if (isMounted) {
            setUser(parsed);
            setImageError(false);
          }
        } else if (isMounted) {
          setUser(null);
        }

        // Luôn fetch thông tin mới nhất từ GET /auth/me để cập nhật avatar và họ tên
        const freshUser = await getMeApi(token);
        // Kiểm tra lại token sau khi await để tránh ghi ngược hope_user sau khi đã logout
        if (freshUser && isMounted && localStorage.getItem("hope_access_token")) {
          setUser(freshUser);
          setImageError(false);
          localStorage.setItem("hope_user", JSON.stringify(freshUser));
        }
      } catch {
        // ignore
      }
    };

    loadUser();

    const handleUserUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<AuthUser | null | undefined>;
      if (customEvent.detail === null) {
        setUser(null);
        setImageError(false);
      } else if (customEvent.detail) {
        setUser(customEvent.detail);
        setImageError(false);
      } else {
        loadUser();
      }
    };

    window.addEventListener("hope_user_updated", handleUserUpdated);
    window.addEventListener("storage", loadUser);
    return () => {
      isMounted = false;
      window.removeEventListener("hope_user_updated", handleUserUpdated);
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  const displayName = user?.fullName || user?.username || "Độc giả";
  const avatarSrc = getAvatarUrl(user?.avatarUrl || user?.avartarUrl);

  const navItems = [
    {
      href: "/home",
      label: "Trang chủ",
      icon: Home,
      visible: true,
    },
    {
      href: "/books",
      label: "Tủ sách Thư viện",
      icon: BookOpen,
      visible: true,
    },
    {
      href: "/borrowing",
      label: "Sách đang mượn",
      icon: ClipboardList,
      visible: hasPermission("LOAN_SELF_READ"),
    },
    {
      href: "/profile",
      label: "Hồ sơ cá nhân",
      icon: UserIcon,
      visible: true,
    },
  ].filter((item) => item.visible);

  const renderSidebarContent = (onNavigate?: () => void) => (
    <div className="flex flex-col h-full bg-[#FAF8F5] border-r border-black/5">
      {/* Brand Logo & Area Badge */}
      <div className="px-5 pt-6 pb-5 border-b border-black/5">
        <div className="flex items-center justify-between">
          <Link
            href="/home"
            onClick={onNavigate}
            className="group select-none"
          >
            <HopeLogo size="md" variant="light" />
          </Link>

          {onNavigate && (
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Đóng menu"
              className="md:hidden p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <span className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/20 text-xs font-semibold">
          <BookMarked className="w-3.5 h-3.5 text-amber-700" />
          <span>Giao diện Độc giả</span>
        </span>
      </div>

      {/* Vertical Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#F5B82E]/20 text-[#B8860B] shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Action */}
      <div className="p-4 border-t border-black/5 space-y-2.5 bg-white/40">
        {user && (
          <BorrowerRemainingBooksCard
            variant="sidebar"
            maxBorrowBooks={maxBorrowBooks}
            borrowedBooksCount={borrowedBooksCount}
            remainingBorrowBooks={remainingBorrowBooks}
            isLoading={isLoadingQuota}
          />
        )}

        <Link
          href="/profile"
          onClick={onNavigate}
          title="Xem hồ sơ cá nhân"
          className="flex items-center gap-3 p-2.5 rounded-2xl bg-white hover:bg-amber-50/50 border border-black/5 hover:border-amber-300 shadow-xs transition-all cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-full bg-[#F5B82E]/20 text-[#B8860B] group-hover:bg-[#F5B82E] group-hover:text-[#1A1A1A] flex items-center justify-center font-bold text-xs transition-colors overflow-hidden shrink-0">
            {avatarSrc && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-sm font-semibold text-neutral-800 group-hover:text-amber-900 leading-tight transition-colors truncate">
              {displayName}
            </span>
            <span className="text-[11px] text-amber-700 font-medium leading-tight mt-0.5">
              Độc giả (BORROWER)
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            requestLogout();
          }}
          title="Đăng xuất khỏi hệ thống"
          className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:text-red-600 hover:bg-red-50 border border-neutral-200 bg-white transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden w-full bg-[#FAF8F5]/95 backdrop-blur-md sticky top-0 z-40 border-b border-black/5 px-4 h-16 flex items-center justify-between">
        <Link href="/home" className="group select-none">
          <HopeLogo size="sm" variant="light" />
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Mở menu"
          className="p-2 rounded-xl text-neutral-700 hover:bg-neutral-200/60 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-50 w-72 max-w-[85vw] h-full shadow-xl">
            {renderSidebarContent(() => setMobileMenuOpen(false))}
          </aside>
        </div>
      )}

      {/* Desktop Left Vertical Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 sticky top-0 h-screen z-40">
        {renderSidebarContent()}
      </aside>
    </>
  );
}
