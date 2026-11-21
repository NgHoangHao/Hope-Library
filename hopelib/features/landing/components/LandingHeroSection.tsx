"use client";

import React from "react";
import {
  LogIn,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { useAuthModal } from "@/features/auth";
import { ScrollReveal } from "./ScrollReveal";

export function LandingHeroSection() {
  const { openLogin } = useAuthModal();

  return (
    <section className="relative w-full overflow-hidden pt-8 pb-20 lg:pt-14 lg:pb-24">
      {/* Ambient decorative background orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-[#F5B82E]/15 blur-3xl animate-landing-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-24 w-[460px] h-[460px] rounded-full bg-[#E8C568]/20 blur-3xl animate-landing-glow"
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Editorial Headline & CTA */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <ScrollReveal delay={40}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5B82E]/15 border border-[#F5B82E]/35 mb-6 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
                <span className="text-[#9E710A] font-semibold text-xs tracking-wider uppercase">
                  {SITE_CONFIG.name} — Không gian tri thức mở
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[68px] leading-[1.08] tracking-tight mb-6">
                <span className="block text-[#171717] font-normal">
                  Đọc để hiểu,
                </span>
                <span className="relative inline-block italic text-[#C48A14] font-normal mt-1.5">
                  hiểu để trưởng thành.
                  <span
                    aria-hidden="true"
                    className="absolute left-0 -bottom-1.5 w-full h-[3px] rounded-full bg-gradient-to-r from-[#F5B82E] via-[#C48A14] to-transparent opacity-70"
                  />
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
                Chào mừng bạn đến với <strong className="text-neutral-900 font-semibold">Hope Library</strong> —
                nơi lưu giữ hàng nghìn đầu sách chọn lọc từ văn học, khoa học đến kỹ năng sống,
                kết hợp hệ thống tra cứu và đặt giữ chỗ trực tuyến hiện đại cho mọi độc giả.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={280}>
              <div className="flex flex-wrap items-center gap-3.5 mb-10">
                <button
                  type="button"
                  onClick={openLogin}
                  className="group inline-flex items-center gap-2.5 bg-[#F5B82E] hover:bg-[#EAA91D] text-[#1A1A1A] font-semibold text-sm sm:text-base px-7 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                <a
                  href="#gioi-thieu"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/85 hover:bg-white text-neutral-800 font-semibold text-sm sm:text-base border border-neutral-200/90 shadow-2xs hover:shadow-sm transition-all"
                >
                  <span>Khám phá thư viện</span>
                  <ChevronDown className="w-4 h-4 text-[#B8860B]" />
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={360} className="w-full max-w-lg">
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200/80">
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                    2.500+
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Bản sách chọn lọc
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                    48 giờ
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Giữ chỗ trực tuyến
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                    7 ngày
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Mở cửa mỗi tuần
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Animated Editorial Photo Showcase */}
          <div className="lg:col-span-6 relative">
            <ScrollReveal direction="right" delay={160}>
              <div className="relative mx-auto max-w-[540px]">
                {/* Main Hero Library Image */}
                <div className="group relative rounded-3xl overflow-hidden shadow-2xl border border-white/80 bg-neutral-100 aspect-[4/3]">
                  <img
                    src="/images/landing/hero-library.jpg"
                    alt="Không gian đọc sách hiện đại và ấm cúng tại Hope Library"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/55 via-transparent to-transparent" />

                  {/* Live status pill top-left */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-semibold text-neutral-800 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Thư viện đang mở cửa</span>
                  </div>

                  {/* Caption bottom-left */}
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="text-[11px] uppercase tracking-widest text-[#F5B82E] font-bold">
                      Không gian học tập &amp; đọc sách
                    </p>
                    <p className="text-sm sm:text-base font-medium text-white/95 mt-0.5">
                      Ánh sáng tự nhiên, yên tĩnh và truyền cảm hứng mỗi ngày.
                    </p>
                  </div>
                </div>

                {/* Floating Card 1: Opening hours */}
                <div className="hidden sm:flex items-center gap-3 absolute -top-5 -right-5 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-neutral-200/70 animate-landing-float">
                  <div className="w-10 h-10 rounded-xl bg-[#F5B82E]/20 text-[#B8860B] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900">
                      07:30 – 21:00
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Thứ 2 đến Thứ 7
                    </div>
                  </div>
                </div>

                {/* Floating Card 2: Smart Portal */}
                <div className="hidden sm:flex items-center gap-3 absolute -bottom-6 -left-6 bg-[#18181A]/95 backdrop-blur-md text-white rounded-2xl px-4 py-3.5 shadow-xl border border-white/10 animate-landing-float-delayed">
                  <div className="w-10 h-10 rounded-xl bg-[#F5B82E] text-[#1A1A1A] flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Mượn trả thông minh</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#F5B82E]" />
                    </div>
                    <div className="text-[11px] text-neutral-300 mt-0.5">
                      Tra cứu nhanh • Đặt trước online
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
