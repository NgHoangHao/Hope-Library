import type { SyntheticEvent } from "react";

/**
 * Compose multiple React event handlers into one (adapted from Astryx design system).
 *
 * Handlers run in argument order. If any handler calls `event.preventDefault()`,
 * subsequent handlers are skipped so consumers can cleanly opt out of built-in
 * component behavior without clobbering props.
 */
export function composeEventHandlers<E extends SyntheticEvent>(
  ...handlers: (((event: E) => void) | undefined)[]
): (event: E) => void {
  return (event: E) => {
    for (const handler of handlers) {
      handler?.(event);
      if (event.defaultPrevented) {
        return;
      }
    }
  };
}
