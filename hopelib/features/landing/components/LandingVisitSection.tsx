"use client";

import React from "react";
import { Clock, MapPin, Phone, ExternalLink, ArrowRight, LogIn, BookOpen } from "lucide-react";
import { useAuthModal } from "@/features/auth";
import { ScrollReveal } from "./ScrollReveal";

const OWNER_FACEBOOK_URL = "https://www.facebook.com/hao.nguyen.454896";

export function LandingVisitSection() {
  const { openLogin } = useAuthModal();

  return (
    <section id="thong-tin" className="pb-20 lg:pb-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <ScrollReveal>
          <div className="relative rounded-[32px] overflow-hidden bg-[#18181A] text-white shadow-2xl border border-white/10">
            {/* Subtle warm gold radial glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F5B82E]/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#C48A14]/15 blur-3xl"
            />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 p-8 sm:p-12 lg:p-14 items-center">
              {/* Left: Library Practical Info */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#F5B82E] mb-3">
                    <BookOpen className="w-3.5 h-3.5" />
                    THÔNG TIN THƯ VIỆN HOPE LIBRARY
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl leading-tight text-white">
                    Ghé thăm không gian đọc hoặc đăng nhập để bắt đầu ngay
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F5B82E]/15 text-[#F5B82E] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                        Giờ mở cửa
                      </div>
                      <div className="text-sm text-white font-medium mt-1">
                        Thứ 2 – Thứ 7: 07:30 – 21:00
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Chủ nhật: 08:30 – 18:00
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F5B82E]/15 text-[#F5B82E] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                        Địa điểm
                      </div>
                      <div className="text-sm text-white font-medium mt-1">
                        Tòa nhà Tri Thức, Tầng 2
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Khuôn viên Hope Library
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#F5B82E]/15 text-[#F5B82E] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                        Hỗ trợ bạn đọc
                      </div>
                      <div className="text-sm text-white font-medium mt-1">
                        (028) 3890 1234
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Quầy thủ thư trực tuyến
                      </div>
                    </div>
                  </div>

                  <a
                    href={OWNER_FACEBOOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F5B82E]/50 flex items-start gap-3.5 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#1877F2]/20 text-[#60A5FA] group-hover:bg-[#1877F2] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="w-4 h-4"
                      >
                        <path d="M22 12.06C22 6.504 17.523 2 12 2S2 6.504 2 12.06c0 5.022 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.522 1.492-3.915 3.777-3.915 1.094 0 2.238.197 2.238.197v2.476h-1.26c-1.243 0-1.63.775-1.63 1.57v1.887h2.773l-.443 2.91h-2.33V22C18.343 21.244 22 17.082 22 12.06Z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                        <span>Liên hệ chủ trang web</span>
                        <ExternalLink className="w-3 h-3 text-[#F5B82E]" />
                      </div>
                      <div className="text-sm text-white font-medium mt-1 group-hover:text-[#F5B82E] transition-colors">
                        Facebook — Hảo Nguyễn
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5 truncate">
                        facebook.com/hao.nguyen.454896
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Right: Call To Action Card */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl bg-white/8 backdrop-blur-md border border-white/15 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5B82E]/20 text-[#F5B82E] text-[11px] font-bold uppercase tracking-wider mb-4">
                      Sẵn sàng khám phá
                    </div>
                    <h3 className="font-serif text-2xl text-white mb-2">
                      Đọc để hiểu, hiểu để trưởng thành.
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
                      Đăng nhập bằng tài khoản Độc giả hoặc Thủ thư của bạn để truy cập
                      kho sách số, đặt mượn trực tuyến và theo dõi phiếu mượn.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openLogin}
                    className="group w-full inline-flex items-center justify-center gap-2.5 bg-[#F5B82E] hover:bg-[#EAA91D] text-[#1A1A1A] font-bold text-sm sm:text-base px-6 py-4 rounded-2xl shadow-lg transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Đăng nhập Hope Library</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
