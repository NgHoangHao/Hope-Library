"use client";

import Link from "next/link";
import { ArrowRight, User as UserIcon, LogOut } from "lucide-react";
import { Button, HopeLogo } from "@/components/ui";
import { useAuthModal } from "@/features/auth";

const LANDING_SECTION_LINKS = [
  { label: "Giới thiệu", href: "#gioi-thieu" },
  { label: "Dịch vụ", href: "#dich-vu" },
  { label: "Thông tin thư viện", href: "#thong-tin" },
];

export function LandingHeader() {
  const { openLogin, user, logout } = useAuthModal();

  return (
    <header className="w-full bg-[#FAF8F5]/85 backdrop-blur-md sticky top-0 z-40 border-b border-neutral-200/50 transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="group select-none">
          <HopeLogo size="md" variant="light" />
        </Link>

        {/* Section Navigation Links */}
        <nav
          aria-label="Điều hướng trang chủ"
          className="hidden md:flex items-center gap-8"
        >
          {LANDING_SECTION_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-neutral-600 hover:text-[#1A1A1A] transition-colors relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-[#F5B82E] hover:after:w-full after:transition-all"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/5 shadow-xs">
                <div className="w-6 h-6 rounded-full bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-neutral-800">
                  {user.fullName || user.username}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Đăng xuất"
                className="p-2 rounded-full text-neutral-500 hover:text-red-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={openLogin}
              className="rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold bg-[#F5B82E] hover:bg-[#EAA91D] text-[#1A1A1A] shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>Đăng nhập</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
