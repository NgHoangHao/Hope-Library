import { CATEGORY_TICKER } from "@/config/site";
import { HopeLogo } from "@/components/ui";

export function LandingFooterTicker() {
  return (
    <footer className="w-full bg-[#18181A] text-white border-t border-white/10 select-none">
      {/* Category Row */}
      <div className="py-4 px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-center flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm tracking-wide">
          <span className="font-bold text-[#F5B82E] tracking-widest text-[11px] sm:text-xs mr-2">
            KHÁM PHÁ
          </span>

          {CATEGORY_TICKER.map((category, index) => (
            <div key={category} className="flex items-center gap-6">
              {index > 0 && (
                <span aria-hidden="true" className="text-white/35 text-xs">
                  •
                </span>
              )}
              <span className="text-neutral-300 hover:text-white transition-colors font-medium text-xs sm:text-[13px]">
                {category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400">
        <div className="flex items-center gap-2.5">
          <HopeLogo size="xs" variant="dark" />
          <span className="text-white/30">|</span>
          <span className="italic">Đọc để hiểu, hiểu để trưởng thành.</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://www.facebook.com/hao.nguyen.454896"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-[#F5B82E] transition-colors font-medium"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="w-3.5 h-3.5 text-[#60A5FA]"
            >
              <path d="M22 12.06C22 6.504 17.523 2 12 2S2 6.504 2 12.06c0 5.022 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.522 1.492-3.915 3.777-3.915 1.094 0 2.238.197 2.238.197v2.476h-1.26c-1.243 0-1.63.775-1.63 1.57v1.887h2.773l-.443 2.91h-2.33V22C18.343 21.244 22 17.082 22 12.06Z" />
            </svg>
            <span>Liên hệ chủ trang web</span>
          </a>
          <span className="text-white/25">|</span>
          <span>© Hope Library. Không gian tri thức mở.</span>
        </div>
      </div>
    </footer>
  );
}
