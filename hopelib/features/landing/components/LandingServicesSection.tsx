"use client";

import React from "react";
import { Search, CalendarCheck2, BookOpenCheck, ShieldCheck } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const SERVICES = [
  {
    step: "01",
    icon: Search,
    title: "Tra cứu trực tuyến tức thì",
    description:
      "Tìm kiếm sách theo tên, tác giả, thể loại hoặc mã ISBN và kiểm tra ngay số lượng bản sao còn sẵn trên kệ.",
  },
  {
    step: "02",
    icon: CalendarCheck2,
    title: "Đặt giữ chỗ online 48 giờ",
    description:
      "Đặt giữ trước tối đa 3 cuốn sách ngay trên hệ thống, đảm bảo sách luôn sẵn sàng khi bạn ghé thư viện nhận.",
  },
  {
    step: "03",
    icon: BookOpenCheck,
    title: "Theo dõi mượn trả minh bạch",
    description:
      "Xem toàn bộ lịch sử mượn sách, hạn trả và thông báo nhắc nhở tự động giúp bạn không bỏ lỡ thời hạn.",
  },
  {
    step: "04",
    icon: ShieldCheck,
    title: "Cổng dịch vụ phân quyền an toàn",
    description:
      "Tự động điều hướng phù hợp cho Độc giả, Thủ thư và Quản trị viên với xác thực bảo mật chặt chẽ.",
  },
];

export function LandingServicesSection() {
  return (
    <section id="dich-vu" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <ScrollReveal className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs font-bold tracking-widest uppercase text-[#C48A14] mb-3">
            TRẢI NGHIỆM THƯ VIỆN SỐ
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] leading-[1.15] text-neutral-900 mb-4">
            Mượn sách dễ dàng chỉ với vài bước
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
            Hệ thống Hope Library số hóa toàn bộ quy trình tra cứu, giữ chỗ và quản lý mượn trả
            nhằm tiết kiệm tối đa thời gian cho bạn đọc.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <ScrollReveal key={service.step} delay={index * 90}>
                <div className="relative h-full bg-white rounded-3xl p-6 border border-neutral-200/75 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 hover:border-[#F5B82E]/60 transition-all duration-300 group flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-neutral-200/80 text-[#B8860B] group-hover:bg-[#F5B82E] group-hover:text-[#1A1A1A] group-hover:border-[#F5B82E] flex items-center justify-center transition-colors duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-serif text-2xl font-bold text-neutral-200 group-hover:text-[#F5B82E]/80 transition-colors">
                      {service.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed flex-1">
                    {service.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
