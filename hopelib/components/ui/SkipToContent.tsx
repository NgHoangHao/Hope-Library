import React from "react";

export interface SkipToContentProps {
  targetId?: string;
  label?: string;
}

/**
 * Accessible "Skip to main content" link (UI/UX Pro Max Priority 1 Accessibility).
 * Visually hidden until keyboard-focused, allowing keyboard users to bypass navigation.
 */
export function SkipToContent({
  targetId = "main-content",
  label = "Chuyển tới nội dung chính",
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[999999] focus:inline-flex focus:items-center focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-stone-900 focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2"
    >
      {label}
    </a>
  );
}

SkipToContent.displayName = "SkipToContent";
