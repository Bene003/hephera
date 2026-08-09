"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Icon } from "../icons";
import { mapRange } from "./motion-utils";

export interface ForgeValue {
  icon: string;
  title: string;
  description: string;
}

const mobileQuery = () => window.matchMedia("(max-width: 767px)");
const subscribeMobile = (onChange: () => void) => {
  const query = mobileQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/**
 * When each value leaves the forge, as a fraction of the pinned scroll.
 * The last one lands at 0.92 so the box is released just after the final value
 * settles, instead of holding the screen on a finished picture.
 * Shared by the chips and the counter so the two can never drift apart.
 */
const scheduleOf = (index: number, count: number) => {
  const start = 0.06 + index * (0.7 / Math.max(count - 1, 1));
  return { start, release: start + 0.06, end: start + 0.16 };
};

const desktopTargets = [
  { x: -340, y: -145, rotate: -8 },
  { x: -175, y: -245, rotate: -4 },
  { x: 0, y: -285, rotate: 0 },
  { x: 175, y: -245, rotate: 4 },
  { x: 340, y: -145, rotate: 8 },
];

const mobileTargets = [
  { x: -92, y: -255, rotate: -5 },
  { x: 92, y: -255, rotate: 5 },
  { x: -92, y: -182, rotate: -3 },
  { x: 92, y: -182, rotate: 3 },
  { x: 0, y: -108, rotate: 0 },
];

function ValueChip({
  item,
  index,
  count,
  progress,
  isMobile,
}: {
  item: ForgeValue;
  index: number;
  count: number;
  progress: MotionValue<number>;
  isMobile: boolean;
}) {
  const target = (isMobile ? mobileTargets : desktopTargets)[index] ?? {
    x: 0,
    y: -120 - index * 45,
    rotate: 0,
  };
  const { start, release, end } = scheduleOf(index, count);

  // Function-based transforms stay in JS. Passing the ranges directly lets
  // framer hand some of them to a native ScrollTimeline, which desynchronises
  // from the others and leaves the chips positioned but invisible.
  const steps = [start, release, end];
  const x = useTransform(() => mapRange(progress.get(), steps, [0, 0, target.x]));
  const y = useTransform(() => mapRange(progress.get(), steps, [70, -18, target.y]));
  const scale = useTransform(() =>
    mapRange(progress.get(), steps, [0.55, 0.84, 1]),
  );
  const opacity = useTransform(() =>
    mapRange(progress.get(), [start, release], [0, 1]),
  );
  const rotate = useTransform(() =>
    mapRange(progress.get(), [release, end], [0, target.rotate]),
  );

  return (
    <motion.div
      style={{ x, y, scale, opacity, rotate }}
      className="absolute top-[58%] left-1/2 z-30 flex w-[158px] -translate-x-1/2 items-center gap-2 rounded-xl border border-ember-500/35 bg-ink-950/94 p-2 shadow-[0_16px_45px_rgba(0,0,0,0.65),0_0_25px_rgba(255,122,24,0.12)] backdrop-blur-xl sm:top-1/2 sm:w-[255px] sm:gap-3 sm:rounded-2xl sm:p-3"
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-ember-500/30 bg-ember-500/10 text-ember-400 sm:size-11 sm:rounded-xl">
        <Icon name={item.icon} className="size-4 sm:size-5" />
      </span>
      <span className="min-w-0">
        <strong className="block truncate font-display text-[0.68rem] font-semibold text-bone-50 sm:text-sm">
          {item.title}
        </strong>
        <span className="mt-0.5 hidden text-[0.65rem] leading-snug text-bone-300 sm:block">
          {item.description}
        </span>
      </span>
    </motion.div>
  );
}

export function ValuesForge({ items }: { items: ForgeValue[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [released, setReleased] = useState(0);
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => mobileQuery().matches,
    () => false,
  );
  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ["start start", "end end"],
  });
  const glowScale = useTransform(scrollYProgress, [0, 1], [0.75, 1.12]);
  const glowOpacity = useTransform(scrollYProgress, [0, 1], [0.18, 0.72]);
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next = items.reduce(
      (total, _, index) =>
        progress >= scheduleOf(index, items.length).release ? total + 1 : total,
      0,
    );
    setReleased((current) => (current === next ? current : next));
  });

  return (
    <div ref={rootRef} className="relative h-[440svh] sm:h-[420vh]">
      <div className="sticky top-0 h-svh overflow-hidden sm:h-screen">
        <div className="relative mx-auto h-full w-full max-w-6xl">
          <motion.div
            aria-hidden
            style={{ scale: glowScale, opacity: glowOpacity }}
            className="absolute top-[58%] left-1/2 h-48 w-[78vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-500/20 blur-3xl sm:top-1/2 sm:h-64"
          />

          {items.map((item, index) => (
            <ValueChip
              key={item.title}
              item={item}
              index={index}
              count={items.length}
              progress={scrollYProgress}
              isMobile={isMobile}
            />
          ))}

          <div className="absolute top-[58%] left-1/2 z-20 aspect-[655/390] w-[min(92vw,655px)] -translate-x-1/2 -translate-y-1/2 sm:top-1/2">
            <svg viewBox="0 0 655 390" aria-hidden className="size-full overflow-visible">
              <defs>
                <linearGradient id="forge-rim" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#ffc078" stopOpacity="0.58" />
                  <stop offset="1" stopColor="#ff7a18" stopOpacity="0.14" />
                </linearGradient>
                <linearGradient id="forge-body" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#20202b" stopOpacity="0.98" />
                  <stop offset="0.55" stopColor="#101017" stopOpacity="0.96" />
                  <stop offset="1" stopColor="#ff7a18" stopOpacity="0.18" />
                </linearGradient>
                <filter id="forge-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="9" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d="M128 124 53 82c-12-7-10-21 3-26l61-23c7-3 15-2 21 3l78 58Z" fill="url(#forge-rim)" stroke="#ff9d42" strokeOpacity=".32" />
              <path d="m527 124 75-42c12-7 10-21-3-26l-61-23c-7-3-15-2-21 3l-78 58Z" fill="url(#forge-rim)" stroke="#ff9d42" strokeOpacity=".32" />
              <path d="M128 124 207 66h241l79 58Z" fill="url(#forge-rim)" stroke="#ffc078" strokeOpacity=".4" />
              <path d="M128 124h399l-38 211c-3 17-18 29-35 29H201c-17 0-32-12-35-29Z" fill="url(#forge-body)" stroke="#ff9d42" strokeOpacity=".38" strokeWidth="2" />
              <path d="M158 153h339" stroke="#ffc078" strokeOpacity=".28" />
              <path d="M193 326h269" stroke="#ff7a18" strokeOpacity=".72" strokeWidth="3" filter="url(#forge-glow)" />
            </svg>

            <div className="absolute inset-x-[25%] bottom-[5%] z-30">
              <div className="flex items-center justify-between text-[0.58rem] tracking-[0.16em] text-bone-500 uppercase">
                <span>{String(released).padStart(2, "0")}</span>
                <span>{String(items.length).padStart(2, "0")}</span>
              </div>
              <div className="mt-1.5 h-px overflow-hidden bg-white/10">
                <motion.div style={{ width: progressWidth }} className="h-full bg-ember-400 shadow-[0_0_10px_#ff7a18]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
