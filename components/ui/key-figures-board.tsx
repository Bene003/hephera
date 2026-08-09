"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { lerp, mapRange, useReducedMotionPref } from "./motion-utils";

export interface KeyFigure {
  prefix: string;
  from: number;
  to: number;
  suffix: string;
  label: string;
}

/**
 * When each figure counts up, as a fraction of the board's scroll range.
 * The last one lands at 0.78 rather than 1 so the row is finished slightly
 * before the board leaves the middle of the viewport.
 */
const scheduleOf = (index: number, count: number) => {
  const start = 0.08 + index * (0.54 / Math.max(count - 1, 1));
  return { start, land: start + 0.16 };
};

const pad = (n: number) => String(n).padStart(2, "0");

function FigureCard({
  item,
  index,
  count,
  progress,
  reduced,
}: {
  item: KeyFigure;
  index: number;
  count: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const { start, land } = scheduleOf(index, count);

  // Seeded with the final value, not `from`: a useTransform would render 0 on
  // the server, so the shipped HTML — and anything that reads it without
  // scrolling — would show a row of zeroes.
  const value = useMotionValue(item.to);

  // Function-based transforms stay in JS. Passing ranges directly lets framer
  // hand them to a native ScrollTimeline, which desynchronises from the
  // JS-driven counter.
  const y = useTransform(() => mapRange(progress.get(), [start, land], [16, 0]));
  const opacity = useTransform(() =>
    mapRange(progress.get(), [start, start + 0.06], [0.3, 1]),
  );
  const scaleX = useTransform(() =>
    mapRange(progress.get(), [start, land], [0, 1]),
  );

  // Rendered as one string on a single element. Safari does not paint a
  // background-clip: text background onto descendant elements, so a nested
  // span for the digits came out fully transparent.
  const text = useTransform(
    () => `${item.prefix}${value.get()}${item.suffix}`,
  );

  const readCount = (p: number) =>
    Math.round(lerp(item.from, item.to, mapRange(p, [start, land], [0, 1])));

  useMotionValueEvent(progress, "change", (p) => {
    value.set(reduced ? item.to : readCount(p));
  });

  // Covers a deep link to #chiffres, where no scroll event ever fires.
  // `value.set` is not React state, so this is not a state-setting effect.
  useEffect(() => {
    value.set(reduced ? item.to : readCount(progress.get()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, item.from, item.to, start, land]);

  const widest = `${item.prefix}${Math.max(Math.abs(item.from), Math.abs(item.to))}${item.suffix}`;

  return (
    <motion.div
      style={reduced ? undefined : { y, opacity }}
      className="h-full"
    >
      {/* card-forge sits on an inner wrapper: its hover translateY would
          otherwise fight the transform framer writes on the element above. */}
      <div className="card-forge h-full overflow-hidden rounded-2xl p-7">
        <span
          aria-hidden
          className="absolute top-5 right-6 font-display text-[0.65rem] tracking-[0.18em] text-bone-500"
        >
          {pad(index + 1)}
        </span>

        <dt className="font-display text-4xl leading-none font-semibold">
          <span className="sr-only">
            {item.prefix}
            {item.to}
            {item.suffix}
          </span>
          <motion.span
            aria-hidden
            className="text-molten inline-block tabular-nums"
            style={{ minWidth: `${widest.length}ch` }}
          >
            {text}
          </motion.span>
        </dt>

        <dd className="mt-3 text-sm leading-relaxed text-bone-300">
          {item.label}
        </dd>

        <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-white/8">
          <motion.div
            style={reduced ? { scaleX: 1 } : { scaleX }}
            className="h-full w-full origin-left bg-ember-400 shadow-[0_0_10px_#ff7a18]"
          />
        </div>
      </div>
    </motion.div>
  );
}

/** Isolated so the cards do not re-render each time the tally ticks. */
function BoardReadout({
  progress,
  count,
}: {
  progress: MotionValue<number>;
  count: number;
}) {
  const [landed, setLanded] = useState(count);

  useMotionValueEvent(progress, "change", (p) => {
    let next = 0;
    for (let i = 0; i < count; i += 1) {
      if (p >= scheduleOf(i, count).land) next += 1;
    }
    setLanded((current) => (current === next ? current : next));
  });

  return (
    <div
      aria-hidden
      className="flex items-center gap-2.5 font-display text-[0.7rem] tracking-[0.2em] text-bone-500 uppercase"
    >
      <span className="relative inline-flex size-1.5">
        <span className="animate-kf-live absolute inset-0 rounded-full bg-ember-400" />
        <span className="relative size-1.5 rounded-full bg-ember-400" />
      </span>
      <span className="tabular-nums">
        {pad(landed)} / {pad(count)}
      </span>
    </div>
  );
}

export function KeyFiguresBoard({ items }: { items: readonly KeyFigure[] }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();

  const { scrollYProgress } = useScroll({
    target: boardRef,
    offset: ["start end", "end center"],
  });

  const glow = useTransform(() =>
    mapRange(scrollYProgress.get(), [0, 0.45, 1], [0.15, 0.6, 0.3]),
  );

  return (
    <div ref={boardRef} className="relative mt-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-px overflow-hidden"
      >
        <div className="animate-kf-sweep h-px w-1/3 bg-linear-to-r from-transparent via-ember-400 to-transparent" />
      </div>

      <motion.div
        aria-hidden
        style={reduced ? undefined : { opacity: glow }}
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,122,24,0.14),transparent_65%)] blur-2xl"
      />

      <BoardReadout progress={scrollYProgress} count={items.length} />

      <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <FigureCard
            key={item.label}
            item={item}
            index={index}
            count={items.length}
            progress={scrollYProgress}
            reduced={reduced}
          />
        ))}
      </dl>
    </div>
  );
}
