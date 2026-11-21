import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#FAF8F5] p-4 sm:p-6 relative overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#F5B82E]/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      
      {/* Main Content Card Container */}
      <div className="w-full max-w-[460px] relative z-10">
        {children}
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-neutral-400">
        &copy; 2026 Hope Library. Đọc để hiểu, Hiểu để trưởng thành.
      </div>
    </div>
  );
}
