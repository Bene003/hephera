"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Flame, Megaphone, MousePointer2, Search } from "lucide-react";

import { lerp, mapRange, useReducedMotionPref } from "../motion-utils";
import type { ServiceSceneProps } from ".";

/**
 * Same two constants as the other scenes, for the same reason: if an ancestor
 * ever breaks `position: sticky`, the pin is traded for the in-viewport model by
 * editing these (track `h-auto`, stage `relative`, `["start end", "end start"]`).
 */
const TRACK_HEIGHT = "h-[300svh] sm:h-[290vh]";
const SCROLL_OFFSET: ["start start", "end end"] = ["start start", "end end"];

/**
 * One slot of the result list, in pixels: row height (`h-9`) plus the gap
 * (`gap-2`). The climb is a translate, so this number has to agree with those
 * two classes or the rows land between slots.
 */
const STEP = 44;

/**
 * Four hops, one per competitor overtaken, with a beat between each so the list
 * reads as settling rather than sliding. The pauses are what make the climb
 * legible at scroll speed.
 */
const HOPS: [number, number][] = [
  [0.12, 0.2],
  [0.24, 0.32],
  [0.36, 0.44],
  [0.48, 0.58],
];

/**
 * Where the result stops reading as buried: the third hop lands it on page one,
 * which is the threshold every "before" line is about. What follows is the last
 * climb to the top spot.
 */
const BROKEN_UNTIL = 0.44;

/** Pagination pill: `size-6` plus `gap-1`. Same agreement as STEP. */
const PAGE_STEP = 28;

function ResultRow({
  mine = false,
  sponsored = false,
  yStops,
  yValues,
  emphasisAt,
  titleWidth,
  progress,
  reduced,
}: {
  mine?: boolean;
  sponsored?: boolean;
  yStops: number[];
  yValues: number[];
  emphasisAt: number;
  titleWidth: string;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const y = useTransform(() => mapRange(progress.get(), yStops, yValues));
  const emphasis = useTransform(() =>
    mapRange(progress.get(), [emphasisAt, emphasisAt + 0.1], [0, 1]),
  );
  // Called on every row, sponsored or not, so the hook count cannot depend on
  // which row happens to carry the paid badge.
  const fade = useTransform(() =>
    mapRange(progress.get(), [0.12, BROKEN_UNTIL], [1, 0]),
  );

  return (
    <motion.div
      style={reduced ? undefined : { y }}
      className={`relative flex h-9 items-center gap-2.5 rounded-lg border border-white/8 bg-ink-800/70 px-2.5 ${
        mine ? "z-10" : ""
      }`}
    >
      {/* The ember face sits on top of the plain one and only its opacity moves:
          animating a colour or a shadow would cost a paint on every frame. */}
      <motion.span
        style={reduced ? { opacity: 1 } : { opacity: emphasis }}
        className={`pointer-events-none absolute inset-0 rounded-lg ${
          mine
            ? "border border-ember-500/40 bg-ember-500/10 shadow-[0_0_24px_-10px_#ff7a18]"
            : "bg-ink-900/55"
        }`}
      />

      <span
        className={`relative flex size-4 shrink-0 items-center justify-center rounded-[5px] ${
          mine ? "bg-ember-500/15 text-ember-400" : "bg-white/8"
        }`}
      >
        {mine ? <Flame className="size-2.5" strokeWidth={2} /> : null}
      </span>

      <span className="relative flex-1">
        <span
          className={`block h-1.5 rounded-full ${mine ? "bg-ember-300/70" : "bg-white/18"}`}
          style={{ width: titleWidth }}
        />
        <span className="mt-1.5 block h-1 w-full rounded-full bg-white/8" />
      </span>

      {/* Before only: a paid badge and the clicks it collects. Both resting
          states are invisible, so reduced motion lands on the ranked poster. */}
      {sponsored && (
        <>
          <motion.span
            style={reduced ? { opacity: 0 } : { opacity: fade }}
            className="relative flex size-4 shrink-0 items-center justify-center rounded-[5px] bg-white/8 text-bone-400"
          >
            <Megaphone className="size-2.5" strokeWidth={2} />
          </motion.span>
          <motion.span
            style={reduced ? { opacity: 0 } : { opacity: fade }}
            className="absolute -right-1.5 -bottom-2"
          >
            <span className="animate-svcseo-click block text-bone-300 opacity-0">
              <MousePointer2 className="size-3" strokeWidth={2} />
            </span>
          </motion.span>
        </>
      )}
    </motion.div>
  );
}

function Caption({
  text,
  label,
  tone,
  enter,
  exit,
  first,
  progress,
  reduced,
}: {
  text: string;
  label: string;
  tone: "before" | "after";
  enter: number;
  exit: number;
  first: boolean;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const opacity = useTransform(() =>
    mapRange(
      progress.get(),
      [enter - 0.04, enter + 0.03, exit - 0.03, exit + 0.04],
      [0, 1, 1, 0],
    ),
  );

  return (
    <motion.p
      style={reduced ? { opacity: 1 } : { opacity }}
      className={`absolute inset-x-0 top-0 text-center text-sm leading-relaxed motion-reduce:static motion-reduce:text-left sm:text-[0.95rem] ${
        tone === "after" ? "text-bone-100" : "text-bone-400"
      } ${first ? "" : "motion-reduce:mt-2"}`}
    >
      <span
        className={`mr-2 font-display text-[0.6rem] tracking-[0.18em] uppercase ${
          tone === "after" ? "text-ember-400" : "text-bone-500"
        }`}
      >
        {label}
      </span>
      {text}
    </motion.p>
  );
}

export function SeoRankScene({
  scene,
  beforeLabel,
  afterLabel,
  scrollHint,
}: ServiceSceneProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: SCROLL_OFFSET,
  });

  // Function form only. Passing ranges directly lets framer hand the property to
  // a native ScrollTimeline, which then desynchronises from the JS-driven parts.
  const railScaleX = useTransform(() =>
    mapRange(scrollYProgress.get(), [0, 1], [0, 1]),
  );
  const glow = useTransform(() =>
    mapRange(scrollYProgress.get(), [0.4, 0.85], [0, 0.75]),
  );
  // The pagination pill walks back from page three to page one alongside the
  // second and third hops, so the badge and the list never disagree.
  const pageX = useTransform(() =>
    mapRange(
      scrollYProgress.get(),
      [HOPS[1][0], HOPS[1][1], HOPS[2][0], HOPS[2][1]],
      [PAGE_STEP * 2, PAGE_STEP, PAGE_STEP, 0],
    ),
  );

  // Seeded with the final value: a useTransform would render metricFrom on the
  // server, so the shipped HTML would advertise the number before the work.
  const metric = useMotionValue(scene.metricTo);
  const metricText = useTransform(() => String(metric.get()));

  const readMetric = (p: number) =>
    Math.round(
      lerp(scene.metricFrom, scene.metricTo, mapRange(p, [0.18, 0.85], [0, 1])),
    );

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    metric.set(reduced ? scene.metricTo : readMetric(p));
  });

  // Covers a deep link, where no scroll event ever fires. `metric.set` is not
  // React state, so this is not a state-setting effect.
  useEffect(() => {
    metric.set(reduced ? scene.metricTo : readMetric(scrollYProgress.get()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, scene.metricFrom, scene.metricTo]);

  // Every problem is stated while the result is still buried, every answer once
  // it has reached page one. The DOM keeps the pairs adjacent so the
  // reduced-motion stack still reads as three couples.
  const captions = scene.problems.flatMap((problem, index) => {
    const count = scene.problems.length;
    const brokenSpan = BROKEN_UNTIL / count;
    const fixedSpan = (1 - BROKEN_UNTIL) / count;
    return [
      {
        text: problem.before,
        label: beforeLabel,
        tone: "before" as const,
        enter: index * brokenSpan,
        exit: (index + 1) * brokenSpan,
      },
      {
        text: problem.after,
        label: afterLabel,
        tone: "after" as const,
        enter: BROKEN_UNTIL + index * fixedSpan,
        exit: BROKEN_UNTIL + (index + 1) * fixedSpan,
      },
    ];
  });

  /**
   * The rows are written in their final order, so the resting DOM is already the
   * poster: your result first, the four competitors below it. The "before" state
   * is expressed as an offset — yours starts four slots down, and each
   * competitor starts one slot up, in the seat it loses when you pass it.
   */
  const competitors = [
    // Rank two after the climb, which means it holds the top spot until the very
    // last hop: the paid result that is renting the position.
    { hop: HOPS[3], titleWidth: "62%", sponsored: true },
    { hop: HOPS[2], titleWidth: "54%", sponsored: false },
    { hop: HOPS[1], titleWidth: "68%", sponsored: false },
    { hop: HOPS[0], titleWidth: "48%", sponsored: false },
  ];

  return (
    <div
      ref={trackRef}
      data-scene="seo-rank"
      // `h-auto!`, not `h-auto`: Tailwind emits the `motion-reduce` variant
      // before the `sm` one, so without the important flag `sm:h-[290vh]` would
      // win and the track would keep its three screens of scroll.
      className={`relative mt-12 motion-reduce:h-auto! ${TRACK_HEIGHT}`}
    >
      <div
        data-stage
        className="sticky top-0 flex h-svh flex-col items-center justify-center gap-6 overflow-hidden motion-reduce:static motion-reduce:h-auto! motion-reduce:py-4 sm:h-screen"
      >
        <div
          aria-hidden
          data-captions
          className="relative h-24 w-[min(92vw,560px)] motion-reduce:h-auto"
        >
          {captions.map((caption, index) => (
            <Caption
              key={caption.text}
              text={caption.text}
              label={caption.label}
              tone={caption.tone}
              enter={caption.enter}
              exit={caption.exit}
              first={index === 0}
              progress={scrollYProgress}
              reduced={reduced}
            />
          ))}
        </div>

        <div aria-hidden className="relative">
          <motion.div
            style={reduced ? { opacity: 0.75 } : { opacity: glow }}
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,122,24,0.22),transparent_65%)] blur-2xl"
          />

          <div className="w-[min(92vw,560px)] overflow-hidden rounded-2xl border border-white/10 bg-ink-850/80 p-3">
            <div className="flex h-8 items-center gap-2 rounded-lg border border-white/8 bg-ink-800/60 px-3">
              <Search className="size-3.5 shrink-0 text-bone-500" strokeWidth={1.8} />
              <span className="h-1.5 w-2/5 rounded-full bg-white/15" />
            </div>

            <div className="mt-3 flex gap-2">
              {/* The rank digits belong to the slots, not to the rows, so they
                  stay put while the list reorders underneath them. */}
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <span
                    key={rank}
                    className="flex h-9 w-5 items-center justify-center font-display text-[0.7rem] text-bone-500 tabular-nums"
                  >
                    {rank}
                  </span>
                ))}
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <ResultRow
                  mine
                  yStops={[
                    HOPS[0][0],
                    HOPS[0][1],
                    HOPS[1][0],
                    HOPS[1][1],
                    HOPS[2][0],
                    HOPS[2][1],
                    HOPS[3][0],
                    HOPS[3][1],
                  ]}
                  yValues={[4, 3, 3, 2, 2, 1, 1, 0].map((slot) => slot * STEP)}
                  emphasisAt={HOPS[3][0]}
                  titleWidth="58%"
                  progress={scrollYProgress}
                  reduced={reduced}
                />
                {competitors.map((competitor) => (
                  <ResultRow
                    key={competitor.titleWidth}
                    sponsored={competitor.sponsored}
                    yStops={competitor.hop}
                    yValues={[-STEP, 0]}
                    emphasisAt={competitor.hop[1]}
                    titleWidth={competitor.titleWidth}
                    progress={scrollYProgress}
                    reduced={reduced}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 flex justify-center">
              <div className="relative flex gap-1">
                <motion.span
                  style={reduced ? undefined : { x: pageX }}
                  className="absolute top-0 left-0 size-6 rounded-md border border-ember-500/40 bg-ember-500/15"
                />
                {[1, 2, 3].map((page) => (
                  <span
                    key={page}
                    className="relative flex size-6 items-center justify-center font-display text-[0.7rem] text-bone-400 tabular-nums"
                  >
                    {page}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div aria-hidden className="w-[min(92vw,560px)]">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-display text-[0.62rem] tracking-[0.18em] text-bone-500 uppercase">
              {scene.metricLabel}
            </span>
            {/* One childless element: WebKit will not paint a
                background-clip: text background onto a descendant element, so a
                nested span for the digits comes out fully transparent. */}
            <motion.span
              data-metric
              className="text-molten font-display text-3xl leading-none font-semibold tabular-nums"
            >
              {metricText}
            </motion.span>
          </div>
          <div className="mt-2 h-px overflow-hidden bg-white/10 motion-reduce:hidden">
            <motion.div
              data-rail
              style={reduced ? undefined : { scaleX: railScaleX }}
              className="h-full w-full origin-left bg-ember-400 shadow-[0_0_10px_#ff7a18]"
            />
          </div>
          <p className="mt-2 text-[0.62rem] tracking-[0.18em] text-bone-500 uppercase motion-reduce:hidden">
            {scrollHint}
          </p>
        </div>

        <p className="sr-only">{scene.sceneAlt}</p>
        <dl className="sr-only">
          {scene.problems.map((problem) => (
            <div key={problem.before}>
              <dt>
                {beforeLabel} : {problem.before}
              </dt>
              <dd>
                {afterLabel} : {problem.after}
              </dd>
            </div>
          ))}
        </dl>
        <p className="sr-only">{scene.metricSr}</p>
      </div>
    </div>
  );
}
