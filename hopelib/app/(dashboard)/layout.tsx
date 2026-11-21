"use client";

import React, { useState, useCallback } from "react";
import { DashboardSidebar, DashboardTopbar } from "@/features/navigation";
import { PageTransition } from "@/components/ui";
import { useLayerDismissal, useFocusTrap } from "@/hooks";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCloseMobile = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useLayerDismissal({
    isOpen: mobileMenuOpen,
    onDismiss: handleCloseMobile,
  });

  const mobileDrawerRef = useFocusTrap<HTMLDivElement>({
    isActive: mobileMenuOpen,
  });

  return (
    <div className="min-h-screen bg-[var(--color-background-body)] flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <DashboardSidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          className="fixed inset-0 z-50 lg:hidden flex"
        >
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-black/50 backdrop-blur-xs ui-backdrop-enter"
            onClick={handleCloseMobile}
          />
          <div
            ref={mobileDrawerRef}
            className="relative z-50 flex-1 max-w-xs w-full bg-[#161616] ui-drawer-enter"
          >
            <DashboardSidebar onCloseMobile={handleCloseMobile} />
          </div>
        </div>
      )}

      {/* Right Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardTopbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-6 sm:p-8 outline-none"
        >
          <PageTransition className="max-w-7xl mx-auto">{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
