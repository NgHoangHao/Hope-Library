"use client";

/**
 * @file interactionModality.ts
 * @description Document-wide singleton tracking last user input modality (`keyboard` | `pointer`),
 * adapted from Astryx's Interaction Modality Architecture.
 *
 * - Key presses without Meta/Alt/Ctrl set `keyboard`.
 * - Pointer presses (mouse/touch/pen) set `pointer`.
 * - Modifier-only combos do not flip modality.
 * - Defaults to `keyboard` on SSR / before first input so restored/initial focus stays perceivable.
 * - Syncs `data-hopelib-modality` on `document.documentElement` for CSS focus-ring gating.
 */

export type InteractionModality = "keyboard" | "pointer";

interface InteractionModalityStore {
  modality: InteractionModality;
  isListening: boolean;
  consumers: number;
  onPointerDown: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

const MODALITY_STORE_KEY = Symbol.for("@hopelib/interaction-modality/v1");
export const MODALITY_ATTRIBUTE = "data-hopelib-modality";

function setDocumentModalityAttribute(
  targetDocument: Document,
  modality: InteractionModality
): void {
  targetDocument.documentElement?.setAttribute(MODALITY_ATTRIBUTE, modality);
}

function getStore(targetDocument: Document): InteractionModalityStore {
  const singletonDoc = targetDocument as Document & {
    [MODALITY_STORE_KEY]?: InteractionModalityStore;
  };
  const existing = singletonDoc[MODALITY_STORE_KEY];
  if (existing) {
    return existing;
  }

  const store: InteractionModalityStore = {
    modality: "keyboard",
    isListening: false,
    consumers: 0,
    onPointerDown: () => {
      if (store.modality !== "pointer") {
        store.modality = "pointer";
        setDocumentModalityAttribute(targetDocument, "pointer");
      }
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.metaKey || event.altKey || event.ctrlKey) {
        return;
      }
      if (store.modality !== "keyboard") {
        store.modality = "keyboard";
        setDocumentModalityAttribute(targetDocument, "keyboard");
      }
    },
  };

  Object.defineProperty(singletonDoc, MODALITY_STORE_KEY, {
    value: store,
  });

  return store;
}

/**
 * Returns the last observed input modality for the document.
 * Safe during SSR (returns `"keyboard"`).
 */
export function getInteractionModality(
  targetDocument: Document | null | undefined = typeof document !== "undefined"
    ? document
    : null
): InteractionModality {
  if (!targetDocument) {
    return "keyboard";
  }
  return getStore(targetDocument).modality;
}

/**
 * Installs document-level modality listeners (reference-counted, StrictMode-safe).
 * Returns a cleanup function.
 */
export function trackInteractionModality(
  targetDocument: Document | null | undefined = typeof document !== "undefined"
    ? document
    : null
): () => void {
  if (!targetDocument) {
    return () => {};
  }

  const store = getStore(targetDocument);
  store.consumers += 1;

  if (!store.isListening) {
    store.isListening = true;
    setDocumentModalityAttribute(targetDocument, store.modality);
    targetDocument.addEventListener("pointerdown", store.onPointerDown, true);
    targetDocument.addEventListener("keydown", store.onKeyDown, true);
  }

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    store.consumers = Math.max(0, store.consumers - 1);
    if (store.consumers === 0 && store.isListening) {
      store.isListening = false;
      targetDocument.removeEventListener("pointerdown", store.onPointerDown, true);
      targetDocument.removeEventListener("keydown", store.onKeyDown, true);
    }
  };
}

/**
 * Focuses an element respecting the last input modality:
 * when available, passes `focusVisible` so pointer-initiated focus restoration
 * does not flash an unwanted keyboard focus ring.
 */
export function focusForLastInput(
  element: HTMLElement | null | undefined,
  options?: { preventScroll?: boolean }
): void {
  if (!element || !element.isConnected) {
    return;
  }

  const modality = getInteractionModality(element.ownerDocument);
  const focusOptions: FocusOptions & { focusVisible?: boolean } = {
    preventScroll: options?.preventScroll ?? false,
    focusVisible: modality === "keyboard",
  };

  try {
    element.focus(focusOptions);
  } catch {
    element.focus({ preventScroll: options?.preventScroll ?? false });
  }
}
