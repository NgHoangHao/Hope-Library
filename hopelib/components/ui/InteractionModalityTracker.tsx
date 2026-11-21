"use client";

import { useEffect } from "react";
import { trackInteractionModality } from "@/lib/interactionModality";

/**
 * Mounts the single document-level interaction modality tracker (keyboard vs pointer).
 * Renders nothing; keeps `data-hopelib-modality` synced on `<html>`.
 */
export function InteractionModalityTracker(): null {
  useEffect(() => {
    return trackInteractionModality(document);
  }, []);

  return null;
}

InteractionModalityTracker.displayName = "InteractionModalityTracker";
