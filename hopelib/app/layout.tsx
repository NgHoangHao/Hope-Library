import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SessionExpiredAlert, LogoutConfirmModal } from "@/features/auth";
import {
  TopCornerAlert,
  InteractionModalityTracker,
  SkipToContent,
} from "@/components/ui";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hope Library — Thư viện của những ước mơ",
  description: "Hàng ngàn cuốn sách đang chờ bạn mở ra. Đọc để hiểu, hiểu để trưởng thành cùng Hope Library.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[var(--color-background-body)] text-[var(--color-text-primary)]">
        <SkipToContent />
        <InteractionModalityTracker />
        {children}
        <SessionExpiredAlert />
        <LogoutConfirmModal />
        <TopCornerAlert listenToGlobalEvents />
      </body>
    </html>
  );
}
