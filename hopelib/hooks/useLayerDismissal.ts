"use client";

import { useEffect } from "react";
import { isImeKeyEvent } from "@/lib/ime";
import { useCommittedRef } from "./useCommittedRef";

/**
 * Shared top-most Escape dismissal stack (adapted from Astryx Layer Runtime).
 *
 * Ensures that when multiple overlays/modals are open simultaneously, pressing Escape:
 * 1. Ignores IME composition events (`isImeKeyEvent`).
 * 2. Dismisses ONLY the top-most registered layer instead of closing every layer at once.
 * 3. Cleans up safely on unmount and React StrictMode replay.
 */

interface LayerEntry {
  onDismiss: () => void;
}

const layerStack: LayerEntry[] = [];
let isGlobalListenerAttached = false;

function handleGlobalKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape") {
    return;
  }
  if (event.defaultPrevented || isImeKeyEvent(event)) {
    return;
  }

  const topEntry = layerStack[layerStack.length - 1];
  if (!topEntry) {
    return;
  }

  event.preventDefault();
  topEntry.onDismiss();
}

function attachGlobalListener(): void {
  if (isGlobalListenerAttached || typeof document === "undefined") {
    return;
  }
  isGlobalListenerAttached = true;
  document.addEventListener("keydown", handleGlobalKeyDown);
}

function detachGlobalListenerIfEmpty(): void {
  if (!isGlobalListenerAttached || layerStack.length > 0 || typeof document === "undefined") {
    return;
  }
  isGlobalListenerAttached = false;
  document.removeEventListener("keydown", handleGlobalKeyDown);
}

export interface UseLayerDismissalOptions {
  isOpen: boolean;
  onDismiss: () => void;
  disabled?: boolean;
}

export function useLayerDismissal({
  isOpen,
  onDismiss,
  disabled = false,
}: UseLayerDismissalOptions): void {
  const onDismissRef = useCommittedRef(onDismiss);

  useEffect(() => {
    if (!isOpen || disabled) {
      return;
    }

    const entry: LayerEntry = {
      onDismiss: () => onDismissRef.current(),
    };

    layerStack.push(entry);
    attachGlobalListener();

    return () => {
      const idx = layerStack.indexOf(entry);
      if (idx !== -1) {
        layerStack.splice(idx, 1);
      }
      detachGlobalListenerIfEmpty();
    };
  }, [isOpen, disabled, onDismissRef]);
}
