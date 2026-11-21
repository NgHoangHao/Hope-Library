"use client";

import React from "react";
import { BookMarked, Users, Compass, HeartHandshake } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const HIGHLIGHTS = [
  {
    icon: BookMarked,
    title: "Kho tàng tri thức đa lĩnh vực",
    description:
      "Tuyển chọn liên tục các đầu sách văn học kinh điển, khoa học công nghệ, kinh tế, tâm lý và nghiên cứu chuyên sâu.",
  },
  {
    icon: Compass,
    title: "Không gian đọc truyền cảm hứng",
    description:
      "Thiết kế mở với ánh sáng tự nhiên, khu đọc yên tĩnh riêng biệt và khu thảo luận nhóm tiện nghi.",
  },
  {
    icon: Users,
    title: "Cộng đồng bạn đọc gắn kết",
    description:
      "Kết nối những người yêu sách qua câu lạc bộ đọc, tọa đàm tác giả và chia sẻ cảm nhận mỗi tháng.",
  },
  {
    icon: HeartHandshake,
    title: "Đồng hành tận tâm cùng độc giả",
    description:
      "Đội ngũ thủ thư luôn sẵn sàng tư vấn chọn sách, hỗ trợ tra cứu tài liệu và quản lý lịch mượn trả minh bạch.",
  },
];

export function LandingAboutSection() {
  return (
    <section
      id="gioi-thieu"
      className="relative py-20 lg:py-28 bg-white/80 border-y border-neutral-200/60 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left: Layered Editorial Image Collage */}
          <div className="lg:col-span-6 relative">
            <ScrollReveal direction="left">
              <div className="relative pb-10 sm:pb-14 pr-0 sm:pr-10">
                {/* Primary Image */}
                <div className="group rounded-3xl overflow-hidden shadow-xl border border-neutral-200/70 aspect-[4/3] bg-neutral-100">
                  <img
                    src="/images/landing/reading-space.jpg"
                    alt="Góc đọc sách yên tĩnh ngập nắng tại Hope Library"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                {/* Secondary Overlapping Image */}
                <div className="hidden sm:block group absolute -bottom-2 right-0 w-56 md:w-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] bg-neutral-100 animate-landing-float-delayed">
                  <img
                    src="/images/landing/book-collection.jpg"
                    alt="Tủ sách tuyển chọn tại Hope Library"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                {/* Editorial Quote Pill */}
                <div className="mt-5 sm:mt-0 sm:absolute sm:top-6 sm:-left-5 bg-[#FAF8F5]/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-[#F5B82E]/30 max-w-[240px]">
                  <p className="font-serif italic text-sm text-neutral-800 leading-snug">
                    “Mỗi trang sách mở ra là một hành trình mới để thấu hiểu thế giới và chính mình.”
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#B8860B] mt-2">
                    — Hope Library
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Story & Highlights */}
          <div className="lg:col-span-6">
            <ScrollReveal delay={80}>
              <div className="text-xs font-bold tracking-widest uppercase text-[#C48A14] mb-3">
                VỀ HOPE LIBRARY
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] leading-[1.15] text-neutral-900 mb-5">
                Nơi tri thức được gìn giữ và lan tỏa mỗi ngày
              </h2>
              <p className="text-neutral-600 text-sm sm:text-base leading-relaxed mb-8">
                Hope Library được xây dựng với sứ mệnh mang thói quen đọc sách trở nên
                gần gũi, hiện đại và tiện lợi hơn. Dù bạn là sinh viên tìm tài liệu nghiên cứu
                hay người yêu sách tìm một góc bình yên cuối ngày, Hope Library luôn rộng mở đón chào.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {HIGHLIGHTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <ScrollReveal key={item.title} delay={120 + idx * 80}>
                    <div className="h-full p-5 rounded-2xl bg-[#FAF8F5] border border-neutral-200/70 hover:border-[#F5B82E]/60 hover:bg-white hover:shadow-md transition-all duration-300 group">
                      <div className="w-10 h-10 rounded-xl bg-[#F5B82E]/15 text-[#B8860B] group-hover:bg-[#F5B82E] group-hover:text-[#1A1A1A] flex items-center justify-center mb-3.5 transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900 mb-1.5">
                        {item.title}
                      </h3>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
