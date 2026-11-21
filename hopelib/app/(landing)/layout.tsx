import type { Metadata } from "next";
import { LandingHeader } from "@/components/layouts/LandingHeader";
import { LandingFooterTicker } from "@/components/layouts/LandingFooterTicker";
import { PageTransition } from "@/components/ui";
import { AuthModalProvider, LoginModal } from "@/features/auth";

export const metadata: Metadata = {
  title: "Hope Library — Đọc để hiểu, Hiểu để trưởng thành",
  description:
    "Hệ thống thư viện điện tử Hope Library. Đăng nhập để bắt đầu tra cứu và trải nghiệm.",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthModalProvider>
      <div className="min-h-screen flex flex-col bg-[var(--color-background-body)] text-[var(--color-text-primary)]">
        <LandingHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col outline-none">
          <PageTransition className="flex-1 flex flex-col">{children}</PageTransition>
        </main>
        <LandingFooterTicker />
        <LoginModal />
      </div>
    </AuthModalProvider>
  );
}
