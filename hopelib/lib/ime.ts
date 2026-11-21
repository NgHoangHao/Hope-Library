/**
 * @file ime.ts
 * @description Shared low-level IME composition guard (adapted from Astryx design system).
 *
 * During IME composition (Vietnamese Telex/VNI, Japanese, Korean, Chinese), the browser
 * fires a `keydown` event to commit or cancel composition before `compositionend`.
 * A plain handler sees `Enter` or `Escape` and prematurely executes commands mid-composition.
 *
 * Both signals are required:
 * - `isComposing`: standard W3C signal
 * - `keyCode === 229`: legacy fallback for IMEs and Safari where `isComposing` is not yet `true`
 *
 * Prefer passing `e.nativeEvent` from React handlers. Structurally typed so both native DOM
 * `KeyboardEvent` and React synthetic events work without casting.
 */

const IME_PROCESSING_KEY_CODE = 229;

export function isImeKeyEvent(event: {
  isComposing?: boolean;
  keyCode?: number;
}): boolean {
  return (
    event.isComposing === true || event.keyCode === IME_PROCESSING_KEY_CODE
  );
}
