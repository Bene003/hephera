"use client";

import { useEffect, useId, useState, type RefObject } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type AnimatedBeamProps = {
  className?: string;
  /**
   * React 19 types `useRef<T>(null)` as `RefObject<T | null>`, so the null has
   * to be part of the contract here or every caller needs a cast.
   */
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  /**
   * Renders a plain lit path instead of the travelling gradient. The link still
   * reads as connected, which is the state the animation resolves to anyway.
   */
  paused?: boolean;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
};

/**
 * A gradient that travels along a curve drawn between two elements.
 *
 * Adapted from the MagicUI original on three points: the palette defaults to the
 * forge ember rather than the purple/orange pair, `duration` is an explicit
 * number instead of `Math.random()` (a random default makes a beam's cadence
 * change on every remount, which is not reproducible), and `paused` gives
 * callers a reduced-motion resting state.
 */
export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 5,
  delay = 0,
  pathColor = "rgba(255,255,255,0.14)",
  pathWidth = 1.5,
  pathOpacity = 1,
  gradientStartColor = "#ff9d42",
  gradientStopColor = "#ff7a18",
  paused = false,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const id = useId();
  const [pathD, setPathD] = useState("");
  const [size, setSize] = useState({ width: 0, height: 0 });

  const gradientCoordinates = reverse
    ? { x1: ["90%", "-10%"], x2: ["100%", "0%"] }
    : { x1: ["10%", "110%"], x2: ["0%", "100%"] };

  useEffect(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;

    const updatePath = () => {
      const box = container.getBoundingClientRect();
      const a = from.getBoundingClientRect();
      const b = to.getBoundingClientRect();

      setSize({ width: box.width, height: box.height });

      const startX = a.left - box.left + a.width / 2 + startXOffset;
      const startY = a.top - box.top + a.height / 2 + startYOffset;
      const endX = b.left - box.left + b.width / 2 + endXOffset;
      const endY = b.top - box.top + b.height / 2 + endYOffset;
      const controlY = startY - curvature;

      setPathD(
        `M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`,
      );
    };

    // The endpoints move whenever the container reflows, and also when either
    // node changes size on its own (an icon swap, a font finally loading).
    const observer = new ResizeObserver(updatePath);
    observer.observe(container);
    observer.observe(from);
    observer.observe(to);
    updatePath();

    return () => observer.disconnect();
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ]);

  return (
    <svg
      fill="none"
      width={size.width}
      height={size.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute top-0 left-0 transform-gpu",
        className,
      )}
      viewBox={`0 0 ${size.width} ${size.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      {paused ? (
        <path
          d={pathD}
          stroke={gradientStartColor}
          strokeWidth={pathWidth}
          strokeOpacity={0.75}
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d={pathD}
            strokeWidth={pathWidth}
            stroke={`url(#${id})`}
            strokeOpacity="1"
            strokeLinecap="round"
          />
          <defs>
            <motion.linearGradient
              className="transform-gpu"
              id={id}
              gradientUnits="userSpaceOnUse"
              initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
              animate={{
                x1: gradientCoordinates.x1,
                x2: gradientCoordinates.x2,
                y1: ["0%", "0%"],
                y2: ["0%", "0%"],
              }}
              transition={{
                delay,
                duration,
                ease: [0.16, 1, 0.3, 1],
                repeat: Infinity,
                repeatDelay: 0,
              }}
            >
              <stop stopColor={gradientStartColor} stopOpacity="0" />
              <stop stopColor={gradientStartColor} />
              <stop offset="32.5%" stopColor={gradientStopColor} />
              <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </>
      )}
    </svg>
  );
}
