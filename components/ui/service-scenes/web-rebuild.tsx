"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { lerp, mapRange, useReducedMotionPref } from "../motion-utils";
import type { ServiceSceneProps } from ".";

/**
 * Kept as constants so the pin can be traded for the in-viewport model in a
 * six-line diff if a future ancestor ever breaks `position: sticky`
 * (track `h-auto`, stage `relative`, offset `["start end", "end start"]`).
 */
const TRACK_HEIGHT = "h-[300svh] sm:h-[290vh]";
const SCROLL_OFFSET: ["start start", "end end"] = ["start start", "end end"];

/**
 * A single schedule shared by the blocks and the counter, so the two can never
 * drift apart.
 *
 * `0 → 0.10` is a hold on the broken state: without it the visitor never sees
 * the problem, and the scene has nothing to demonstrate. `0.78 → 1` is a hold on
 * the repaired state, so the payoff has time to land.
 */
/**
 * Where the mock stops reading as broken. The blocks repair from 0.10 to 0.78,
 * so by here the hero, the title and the paragraphs are already in place.
 */
const BROKEN_UNTIL = 0.44;

const scheduleOf = (index: number) => {
  const start = 0.1 + index * 0.104;
  return { start, end: start + 0.16 };
};

const mobileQuery = () => window.matchMedia("(max-width: 639px)");
const subscribeMobile = (onChange: () => void) => {
  const query = mobileQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** Every axis is always present, so every block creates the same number of
    motion values and the hook order can never depend on the data. */
type BlockState = {
  x: number;
  y: number;
  rotate: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
};

const neutral: BlockState = { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1, opacity: 1 };

type BlockSpec = {
  id: string;
  className: string;
  radius: string;
  origin: string;
  /** The repaired colour. Only the visual anchors turn ember — tinting the copy
      bars too would read as "an orange rectangle", not as a designed page. */
  tint: string;
  from: Partial<BlockState>;
  to: Partial<BlockState>;
};

const emberTint = "bg-linear-to-br from-ember-500/70 to-ember-700/30";
const copyTint = "bg-white/28";

/**
 * Five blocks morphed from broken to correct, plus the call to action below.
 * One DOM set, never two: an "after" copy fading over a "before" copy reads as a
 * slideshow, not as a repair.
 */
const blocks: BlockSpec[] = [
  {
    id: "hero",
    className: "h-[30%]",
    radius: "rounded-md",
    origin: "origin-top-left",
    tint: emberTint,
    from: { scaleY: 0.55, x: -14, rotate: -2.5, opacity: 0.5 },
    to: {},
  },
  {
    id: "h1",
    className: "h-[7%] w-[86%]",
    radius: "rounded-full",
    origin: "origin-left",
    tint: copyTint,
    from: { scaleX: 1.18, x: 10 },
    to: { scaleX: 0.62 },
  },
  {
    id: "p1",
    className: "h-[5%] w-[86%]",
    radius: "rounded-full",
    origin: "origin-left",
    tint: copyTint,
    from: { scaleX: 0.48, x: -8 },
    to: { scaleX: 0.95 },
  },
  {
    id: "p2",
    className: "h-[5%] w-[86%]",
    radius: "rounded-full",
    origin: "origin-left",
    tint: copyTint,
    from: { scaleX: 1.32, x: 6 },
    to: { scaleX: 0.78 },
  },
  {
    id: "proof",
    className: "h-[9%] w-[60%]",
    radius: "rounded-md",
    origin: "origin-left",
    tint: "bg-ember-500/22",
    from: { x: 18, y: 8, rotate: 3, opacity: 0.35 },
    to: { scaleX: 0.9 },
  },
];

/** Translations only. Scales and rotations already read fine at 345px, but a
    raw 18px offset in a 345px frame looks like a broken layout, not a nudge. */
const dampen = (state: BlockState, factor: number): BlockState => ({
  ...state,
  x: state.x * factor,
  y: state.y * factor,
  rotate: state.rotate * factor,
});

function RebuildBlock({
  spec,
  index,
  progress,
  damp,
  reduced,
}: {
  spec: BlockSpec;
  index: number;
  progress: MotionValue<number>;
  damp: number;
  reduced: boolean;
}) {
  const { start, end } = scheduleOf(index);
  const from = dampen({ ...neutral, ...spec.from }, damp);
  const to = { ...neutral, ...spec.to };

  const at = (key: keyof BlockState) =>
    mapRange(progress.get(), [start, end], [from[key], to[key]]);

  const x = useTransform(() => at("x"));
  const y = useTransform(() => at("y"));
  const rotate = useTransform(() => at("rotate"));
  const scaleX = useTransform(() => at("scaleX"));
  const scaleY = useTransform(() => at("scaleY"));
  const opacity = useTransform(() => at("opacity"));

  // The ember tint is a sibling layer whose opacity is scrubbed over the grey
  // base. `filter: grayscale()` would be the obvious move and the wrong one: it
  // is not compositable and WebKit handles it badly.
  const tint = useTransform(() => mapRange(progress.get(), [start, end], [0, 1]));

  return (
    <motion.div
      data-block={spec.id}
      style={reduced ? undefined : { x, y, rotate, scaleX, scaleY, opacity }}
      className={`relative shrink-0 bg-white/12 ${spec.radius} ${spec.origin} ${spec.className}`}
    >
      <motion.span
        style={reduced ? { opacity: 1 } : { opacity: tint }}
        className={`absolute inset-0 ${spec.tint} ${spec.radius}`}
      />
    </motion.div>
  );
}

/** The call to action, last and on its own: it does not exist at all in the
    "before" state, which is the sharpest thing the scene has to say. */
function CtaBlock({
  progress,
  reduced,
}: {
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const { start, end } = scheduleOf(5);

  const opacity = useTransform(() =>
    mapRange(progress.get(), [start, start + 0.06], [0, 1]),
  );
  // Three stops, so it overshoots and settles instead of easing into place.
  const scale = useTransform(() =>
    mapRange(progress.get(), [start, start + 0.11, end], [0.6, 1.06, 1]),
  );
  const y = useTransform(() => mapRange(progress.get(), [start, end], [14, 0]));

  return (
    <motion.div
      data-block="cta"
      style={reduced ? undefined : { opacity, scale, y }}
      className="mt-auto h-[11%] w-[42%] shrink-0 rounded-md bg-linear-to-r from-ember-500 to-ember-600 shadow-[0_8px_26px_-8px_rgba(255,122,24,0.8)]"
    />
  );
}

/** Captions crossfade rather than morph: you do not interpolate a sentence.
    Absolutely positioned in a fixed-height box so nothing below ever reflows. */
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

export function WebRebuildScene({
  scene,
  beforeLabel,
  afterLabel,
  scrollHint,
}: ServiceSceneProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => mobileQuery().matches,
    () => false,
  );
  const damp = isMobile ? 0.45 : 1;

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: SCROLL_OFFSET,
  });

  // Function form only. Passing ranges directly lets framer hand the property to
  // a native ScrollTimeline, which then desynchronises from the JS-driven parts.
  const railScaleX = useTransform(() => mapRange(scrollYProgress.get(), [0, 1], [0, 1]));
  const brokenGlow = useTransform(() =>
    mapRange(scrollYProgress.get(), [0.1, 0.45], [0.55, 0]),
  );
  const fixedGlow = useTransform(() =>
    mapRange(scrollYProgress.get(), [0.45, 0.85], [0, 0.7]),
  );
  const brokenChrome = useTransform(() =>
    mapRange(scrollYProgress.get(), [0.1, 0.5], [1, 0]),
  );
  const emberRing = useTransform(() =>
    mapRange(scrollYProgress.get(), [0.35, 0.85], [0, 1]),
  );

  // Seeded with the final value: a useTransform would render metricFrom on the
  // server, so the shipped HTML would advertise the broken number.
  const metric = useMotionValue(scene.metricTo);
  const metricText = useTransform(() => String(metric.get()));

  const readMetric = (p: number) =>
    Math.round(
      lerp(scene.metricFrom, scene.metricTo, mapRange(p, [0.14, 0.82], [0, 1])),
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

  // The mock morphs once, continuously, so the captions cannot alternate
  // before/after/before: the third "before" would land on an already repaired
  // page. Every problem is stated while it is still visible, every answer once
  // the blocks have settled. The DOM keeps the pairs adjacent so the
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

  return (
    <div
      ref={trackRef}
      data-scene="web-rebuild"
      // `h-auto!`, not `h-auto`: Tailwind emits the `motion-reduce` variant
      // before the `sm` one, so without the important flag `sm:h-[290vh]` would
      // win and the track would keep its three screens of scroll.
      className={`relative mt-12 motion-reduce:h-auto! ${TRACK_HEIGHT}`}
    >
      <div
        data-stage
        className="sticky top-0 flex h-svh flex-col items-center justify-center gap-5 overflow-hidden motion-reduce:static motion-reduce:h-auto! motion-reduce:gap-6 motion-reduce:py-4 sm:h-screen"
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

        <div aria-hidden className="relative w-[min(92vw,560px)]">
          <motion.div
            style={reduced ? { opacity: 0 } : { opacity: brokenGlow }}
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(120,120,140,0.22),transparent_65%)] blur-2xl"
          />
          <motion.div
            style={reduced ? { opacity: 0.7 } : { opacity: fixedGlow }}
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,122,24,0.2),transparent_65%)] blur-2xl"
          />

          <div className="relative aspect-16/11 overflow-hidden rounded-2xl border border-white/10 bg-ink-950">
            <motion.span
              style={reduced ? { opacity: 1 } : { opacity: emberRing }}
              className="pointer-events-none absolute inset-0 z-20 rounded-2xl ring-1 ring-ember-500/45"
            />

            {/* Browser chrome. The spinner and the scanline are the only things
                that move during the opening hold, and both are pure CSS. */}
            <div className="flex h-8 items-center gap-1.5 border-b border-white/8 px-3">
              <span className="size-1.5 rounded-full bg-ember-500/60" />
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="size-1.5 rounded-full bg-white/20" />
              <span className="ml-1.5 h-1.5 flex-1 rounded-full bg-white/8" />
              <motion.span
                style={reduced ? { opacity: 0 } : { opacity: brokenChrome }}
                className="animate-svcweb-spin size-2.5 shrink-0 rounded-full border border-white/20 border-t-ember-400 motion-reduce:hidden"
              />
            </div>

            <motion.span
              style={reduced ? { opacity: 0 } : { opacity: brokenChrome }}
              className="animate-svcweb-scan pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3 bg-linear-to-r from-transparent via-white/10 to-transparent motion-reduce:hidden"
            />

            <div className="flex h-[calc(100%-2rem)] flex-col gap-[3%] p-[5%]">
              {blocks.map((spec, index) => (
                <RebuildBlock
                  key={spec.id}
                  spec={spec}
                  index={index}
                  progress={scrollYProgress}
                  damp={damp}
                  reduced={reduced}
                />
              ))}
              <CtaBlock progress={scrollYProgress} reduced={reduced} />
            </div>
          </div>

          {/* Visitors. The ones who leave only exist while the page is broken;
              the ones who convert arrive with the call to action. */}
          <motion.div
            style={reduced ? { opacity: 0 } : { opacity: brokenChrome }}
            className="pointer-events-none absolute -top-3 left-[14%] z-10 flex gap-3 motion-reduce:hidden"
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="animate-svcweb-bounce size-1.5 rounded-full bg-bone-400 opacity-0"
                style={{ animationDelay: `${dot * 500}ms` }}
              />
            ))}
          </motion.div>
          <motion.div
            style={reduced ? { opacity: 0 } : { opacity: emberRing }}
            className="pointer-events-none absolute right-[18%] -bottom-3 z-10 flex gap-3 motion-reduce:hidden"
          >
            {[0, 1].map((dot) => (
              <span
                key={dot}
                className="animate-svcweb-convert size-1.5 rounded-full bg-ember-400 opacity-0"
                style={{ animationDelay: `${dot * 700}ms` }}
              />
            ))}
          </motion.div>
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
