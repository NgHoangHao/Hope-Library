import type { Metadata } from "next";
import { BorrowerHeader } from "@/components/layouts/BorrowerHeader";
import { PageTransition } from "@/components/ui";
import { AuthModalProvider, LogoutConfirmModal } from "@/features/auth";

export const metadata: Metadata = {
  title: "Không gian Độc giả — Hope Library",
  description:
    "Cổng thông tin và không gian tra cứu, mượn trả sách dành cho độc giả Hope Library.",
};

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthModalProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-background-body)] text-[var(--color-text-primary)]">
        <BorrowerHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0 flex flex-col outline-none">
          <PageTransition className="flex-1 flex flex-col">{children}</PageTransition>
        </main>
        <LogoutConfirmModal />
      </div>
    </AuthModalProvider>
  );
}
