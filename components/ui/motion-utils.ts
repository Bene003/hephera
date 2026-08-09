"use client";

import { useSyncExternalStore } from "react";

/** Clamped piecewise interpolation, evaluated in JS. */
export const mapRange = (
  value: number,
  inputs: number[],
  outputs: number[],
) => {
  if (value <= inputs[0]) return outputs[0];
  const last = inputs.length - 1;
  if (value >= inputs[last]) return outputs[last];
  const i = inputs.findIndex((stop) => value < stop) - 1;
  const span = inputs[i + 1] - inputs[i];
  const t = span === 0 ? 0 : (value - inputs[i]) / span;
  return outputs[i] + (outputs[i + 1] - outputs[i]) * t;
};

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;

const reducedQuery = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)");

const subscribeReduced = (onChange: () => void) => {
  const query = reducedQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/**
 * Reads the reduced-motion preference without a state-setting effect, which is
 * what the `react-hooks/set-state-in-effect` rule forbids. Returns false on the
 * server so the markup matches the animated first paint.
 */
export function useReducedMotionPref() {
  return useSyncExternalStore(
    subscribeReduced,
    () => reducedQuery().matches,
    () => false,
  );
}
