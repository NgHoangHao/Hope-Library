"use client";

import { useEffect, useRef, type RefObject } from "react";
import { focusForLastInput } from "@/lib/interactionModality";

/**
 * Accessible focus trap hook (adapted from Astryx `useFocusTrap` / WAI-ARIA Dialog APG).
 *
 * - Captures the previously focused element before the trap activates.
 * - Moves initial focus into the container (respecting keyboard vs pointer modality).
 * - Loops `Tab` and `Shift+Tab` across visibly focusable elements (excluding `inert`,
 *   `hidden`, `disabled`, and `aria-hidden="true"` subtrees).
 * - Restores focus to the triggering element on close via `focusForLastInput`.
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "summary",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable='true']",
].join(", ");

function isVisiblyFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute("inert") || element.closest("[inert]")) {
    return false;
  }
  if (element.hidden || element.closest("[hidden]")) {
    return false;
  }
  if (element.closest("[aria-hidden='true']")) {
    return false;
  }
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  return true;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );
  return candidates.filter(isVisiblyFocusable);
}

export interface UseFocusTrapOptions {
  isActive: boolean;
  /** Whether to move focus into the container when activated (default: true). */
  autoFocus?: boolean;
  /** Whether to return focus to the previous element when deactivated (default: true). */
  restoreFocus?: boolean;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isActive,
  autoFocus = true,
  restoreFocus = true,
}: UseFocusTrapOptions): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Move focus into the dialog if focus isn't already inside it
    if (autoFocus && !container.contains(document.activeElement)) {
      const focusables = getFocusableElements(container);
      const target = focusables[0] ?? container;
      if (target === container && !container.hasAttribute("tabindex")) {
        container.setAttribute("tabindex", "-1");
      }
      focusForLastInput(target, { preventScroll: true });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusables = getFocusableElements(container);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          first.ownerDocument && focusForLastInput(last);
        }
      } else {
        if (active === last || !container.contains(active)) {
          event.preventDefault();
          focusForLastInput(first);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (restoreFocus && previousFocusRef.current) {
        focusForLastInput(previousFocusRef.current, { preventScroll: true });
      }
      previousFocusRef.current = null;
    };
  }, [isActive, autoFocus, restoreFocus]);

  return containerRef;
}
