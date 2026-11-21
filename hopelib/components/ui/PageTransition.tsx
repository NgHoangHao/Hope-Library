"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps route content to provide a subtle, GPU-composited fade + rise transition
 * whenever the active pathname changes. Automatically disabled under prefers-reduced-motion.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={cn("ui-page-enter", className)}>
      {children}
    </div>
  );
}

PageTransition.displayName = "PageTransition";
