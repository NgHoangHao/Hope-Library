"use client";

import { useInsertionEffect, useRef } from "react";

/**
 * Returns a ref whose `current` always holds the latest committed render value
 * (adapted from Astryx `architecture:react-component-runtime` INV3).
 *
 * Read `current` only inside event, timer, or gesture callbacks — never during render.
 * Replaces manual `useRef` + `useEffect` sync boilerplate with a single commit-phase
 * `useInsertionEffect` write.
 */
export function useCommittedRef<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useCommittedRefInto(ref, value);
  return ref;
}

/**
 * Writes the latest committed value into an existing `ref` during `useInsertionEffect`.
 */
export function useCommittedRefInto<T>(ref: { current: T }, value: T): void {
  useInsertionEffect(() => {
    ref.current = value;
  });
}
