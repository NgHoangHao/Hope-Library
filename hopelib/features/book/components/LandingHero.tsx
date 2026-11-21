"use client";

import React from "react";
import { LogIn, ArrowRight, ShieldCheck, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { useAuthModal } from "@/features/auth";

export function LandingHero() {
  const { openLogin } = useAuthModal();

  return (
    <section className="relative w-full overflow-hidden pt-6 pb-16 lg:py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center min-h-[520px]">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 flex flex-col items-start z-10">
            {/* Tagline / Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5B82E]/15 border border-[#F5B82E]/30 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
              <span className="text-[#B8860B] font-semibold text-xs tracking-wider uppercase">
                {SITE_CONFIG.name} — Cổng dịch vụ thư viện
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-[72px] leading-[1.08] tracking-tight mb-6">
              <span className="block text-[#171717] font-normal">
                Đọc để hiểu.
              </span>
              <span className="block italic text-[#C48A14] font-normal mt-1">
                Hiểu để trưởng thành.
              </span>
            </h1>

            {/* Subtitle / Description */}
            <p className="text-neutral-600 text-sm sm:text-base leading-relaxed max-w-lg mb-8 sm:mb-10 font-normal">
              Chào mừng bạn đến với Hope Library. Không gian số đồng hành cùng tri thức, 
              giúp độc giả dễ dàng mượn trả và quản lý tài liệu học tập một cách thuận tiện nhất.
            </p>

            {/* ONLY Primary CTA Action: Nút Login */}
            <div className="flex items-center gap-4 mb-10">
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex items-center gap-3 bg-[#F5B82E] hover:bg-[#EAA91D] text-[#1A1A1A] font-semibold text-base sm:text-lg px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                <span>Đăng nhập hệ thống</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Platform Feature Trust Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200/80 w-full max-w-xl">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C48A14] shrink-0" />
                <span className="text-xs text-neutral-600 font-medium">Tra cứu & mượn trả nhanh</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C48A14] shrink-0" />
                <span className="text-xs text-neutral-600 font-medium">Phân quyền vai trò rõ ràng</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C48A14] shrink-0" />
                <span className="text-xs text-neutral-600 font-medium">Xác thực an toàn OTP</span>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Information Card (No Book List) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Subtle background glow */}
            <div className="absolute w-[320px] h-[320px] rounded-full bg-[#F5C742]/25 blur-3xl -z-10" />

            {/* Elegant Portal Showcase Card */}
            <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl border border-neutral-200/80 relative">
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1A1A1A]">Cổng Đăng Nhập</h3>
                    <p className="text-xs text-neutral-500">Hope Library Portal</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Hoạt động</span>
                </div>
              </div>

              {/* Roles Description */}
              <div className="space-y-4 my-6">
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    DG
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900">
                      Dành cho Độc giả (Borrower)
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                      Đăng nhập để vào trang Home tra cứu, đăng ký mượn sách và theo dõi lịch trả.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    QL
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900">
                      Dành cho Thủ thư & Quản trị (Librarian / Admin)
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                      Tự động chuyển tiếp vào Dashboard quản trị kho sách, bạn đọc và phân quyền.
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className="flex items-center gap-2 pt-4 border-t border-neutral-100 text-[11px] text-neutral-500">
                <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Hệ thống áp dụng chính sách điều hướng theo đúng quyền hạn tài khoản.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
