import React, { useId } from "react";
import { cn } from "@/lib/utils";

export type HopeLogoSize = "xs" | "sm" | "md" | "lg";
export type HopeLogoVariant = "light" | "dark";

const MARK_SIZE_CLASSES: Record<HopeLogoSize, string> = {
  xs: "w-6 h-6 rounded-md",
  sm: "w-8 h-8 rounded-lg",
  md: "w-9 h-9 rounded-xl",
  lg: "w-10 h-10 rounded-xl",
};

const WORDMARK_SIZE_CLASSES: Record<HopeLogoSize, string> = {
  xs: "text-xs gap-1 tracking-wider",
  sm: "text-sm sm:text-base gap-1 tracking-wider",
  md: "text-base sm:text-lg gap-1.5 tracking-wider",
  lg: "text-base gap-1.5 tracking-widest",
};

interface HopeLogoMarkProps {
  size?: HopeLogoSize;
  className?: string;
}

/**
 * Biểu tượng chữ H cách điệu kết hợp hình ảnh trang sách mở và tia sáng tri thức (Hope Library)
 */
export function HopeLogoMark({ size = "md", className }: HopeLogoMarkProps) {
  const uid = useId();
  const bgGradientId = `${uid}-hope-gold-bg`;
  const sheenGradientId = `${uid}-hope-gold-sheen`;

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs ring-1 ring-black/10 transition-transform duration-200 group-hover:scale-105",
        MARK_SIZE_CLASSES[size],
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient
            id={bgGradientId}
            x1="4"
            y1="2"
            x2="36"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFD25A" />
            <stop offset="52%" stopColor="#F5B82E" />
            <stop offset="100%" stopColor="#D99614" />
          </linearGradient>
          <linearGradient
            id={sheenGradientId}
            x1="20"
            y1="0"
            x2="20"
            y2="20"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gold Rounded Canvas */}
        <rect width="40" height="40" rx="10" fill={`url(#${bgGradientId})`} />
        <rect width="40" height="20" rx="10" fill={`url(#${sheenGradientId})`} />
        <rect
          x="1.25"
          y="1.25"
          width="37.5"
          height="37.5"
          rx="8.75"
          stroke="#1A1A1A"
          strokeOpacity="0.08"
          strokeWidth="1"
        />

        {/* Stylized Editorial H Monogram */}
        {/* Left pillar with refined editorial serifs */}
        <path
          d="M9.5 10.5H15.2V12.2H14.2V27.8H15.2V29.5H9.5V27.8H10.7V12.2H9.5V10.5Z"
          fill="#18181A"
        />

        {/* Right pillar with refined editorial serifs */}
        <path
          d="M24.8 10.5H30.5V12.2H29.3V27.8H30.5V29.5H24.8V27.8H25.8V12.2H24.8V10.5Z"
          fill="#18181A"
        />

        {/* Open-book curved crossbar connecting the two pillars */}
        <path
          d="M13.6 20.6C15.8 18.8 18.2 18.4 20 20.2C21.8 18.4 24.2 18.8 26.4 20.6V23.3C24.2 21.5 21.9 21.2 20 22.8C18.1 21.2 15.8 21.5 13.6 23.3V20.6Z"
          fill="#18181A"
        />

        {/* Hope Spark (4-point star above the open-book arch) */}
        <path
          d="M20 11.4L20.9 14L23.5 14.9L20.9 15.8L20 18.4L19.1 15.8L16.5 14.9L19.1 14L20 11.4Z"
          fill="#18181A"
        />
      </svg>
    </span>
  );
}

interface HopeLogoProps {
  size?: HopeLogoSize;
  variant?: HopeLogoVariant;
  showWordmark?: boolean;
  className?: string;
}

/**
 * Logo thương hiệu Hope Library đồng bộ toàn bộ Frontend
 */
export function HopeLogo({
  size = "md",
  variant = "light",
  showWordmark = true,
  className,
}: HopeLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <HopeLogoMark size={size} />
      {showWordmark && (
        <span
          className={cn(
            "inline-flex items-center font-bold",
            WORDMARK_SIZE_CLASSES[size]
          )}
        >
          <span className={variant === "dark" ? "text-white" : "text-[#1A1A1A]"}>
            HOPE
          </span>
          <span className={variant === "dark" ? "text-[#F5B82E]" : "text-[#C69214]"}>
            LIBRARY
          </span>
        </span>
      )}
    </span>
  );
}
