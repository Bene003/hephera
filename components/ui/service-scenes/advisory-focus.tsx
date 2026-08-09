"use client";

import { useRef, useState } from "react";
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
 * Same two constants as the other scenes, for the same reason: if an ancestor
 * ever breaks `position: sticky`, the pin is traded for the in-viewport model by
 * editing these (track `h-auto`, stage `relative`, `["start end", "end start"]`).
 */
const TRACK_HEIGHT = "h-[300svh] sm:h-[290vh]";
const SCROLL_OFFSET: ["start start", "end end"] = ["start start", "end end"];

/**
 * This is the one scene that is stepped rather than scrubbed, and on purpose: an
 * arbitration is a decision, not a fade. Each threshold drops one ring of ideas
 * and locks one priority into the plan, so the scroll reads as a sequence of
 * calls being made. Six thresholds, six phases, six commitments.
 */
const PHASE_AT = [0.14, 0.24, 0.34, 0.44, 0.56, 0.68];
const phaseOf = (progress: number) =>
  PHASE_AT.filter((stop) => progress >= stop).length;

/**
 * Where the wall stops reading as a wall: by the fourth phase every discarded
 * idea is gone and half the plan is standing.
 */
const BROKEN_UNTIL = 0.44;

/**
 * The thirty-four ideas that do not make the cut, laid out on a golden-angle
 * spiral. A formula rather than a random seed: the server and the client have to
 * agree on every position, and a scatter that is even by construction fills the
 * frame without anyone hand-placing thirty-four chips.
 *
 * The ring number comes from the radius, so the wall clears from the outside in
 * — which is what narrowing down looks like.
 */
const DISCARDED = Array.from({ length: 34 }, (_, index) => {
  const angle = index * 2.3999632;
  const radius = Math.sqrt((index + 0.5) / 34);
  return {
    left: Number((50 + Math.cos(angle) * radius * 44).toFixed(2)),
    top: Number((50 + Math.sin(angle) * radius * 40).toFixed(2)),
    rotate: ((index * 47) % 23) - 11,
    width: 22 + ((index * 17) % 40),
    ring: radius > 0.78 ? 0 : radius > 0.5 ? 1 : 2,
    delay: (index % 6) * 45,
  };
});

/**
 * The six that do. Each one starts as a chip somewhere in the wall and travels
 * to its rank, so the plan is visibly made *of* the ideas rather than handed
 * down next to them. Offsets are in pixels and stay inside the clipped frame.
 */
const PRIORITIES = [
  { dx: -104, dy: -74, rotate: -9 },
  { dx: 98, dy: -52, rotate: 7 },
  { dx: -80, dy: 60, rotate: 5 },
  { dx: 110, dy: 42, rotate: -6 },
  { dx: -44, dy: -92, rotate: 8 },
  { dx: 64, dy: 84, rotate: -4 },
];

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

export function AdvisoryFocusScene({
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
    mapRange(scrollYProgress.get(), [0.5, 0.9], [0, 0.75]),
  );

  // Seeded with the final value: a useTransform would render metricFrom on the
  // server, so the shipped HTML would advertise the number before the work.
  const metric = useMotionValue(scene.metricTo);
  const metricText = useTransform(() => String(metric.get()));

  const readMetric = (p: number) =>
    Math.round(
      lerp(scene.metricFrom, scene.metricTo, mapRange(p, [0.18, 0.85], [0, 1])),
    );

  // No mount effect to seed this one, unlike the counter: a deep link lands with
  // a non-zero progress, which is a change, so the event fires on its own. The
  // only case that never fires is progress zero, where phase zero is right.
  const [phase, setPhase] = useState(0);
  const activePhase = reduced ? PHASE_AT.length : phase;

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    metric.set(reduced ? scene.metricTo : readMetric(p));
    setPhase(phaseOf(p));
  });

  // Every problem is stated while the wall is still up, every answer once the
  // plan is standing. The DOM keeps the pairs adjacent so the reduced-motion
  // stack still reads as three couples.
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
      data-scene="advisory-focus"
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

          <div
            data-board
            className="relative h-[280px] w-[min(92vw,560px)] overflow-hidden rounded-2xl border border-white/10 bg-ink-850/80 sm:h-[300px]"
          >
            {DISCARDED.map((chip, index) => {
              const dropped = activePhase > chip.ring;
              return (
                <span
                  key={index}
                  className="absolute h-1.5 rounded-full bg-white/14 transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    left: `${chip.left}%`,
                    top: `${chip.top}%`,
                    width: chip.width,
                    opacity: dropped ? 0 : 1,
                    transform: `translate(-50%, -50%) rotate(${chip.rotate}deg) scale(${dropped ? 0.5 : 1})`,
                    transitionDelay: `${chip.delay}ms`,
                  }}
                />
              );
            })}

            {/* Flex, not hand-computed offsets: the rows are transform-only, so
                the layout still centres itself whatever the board height is. */}
            <div className="absolute inset-0 flex flex-col justify-center gap-2 px-6">
              {PRIORITIES.map((priority, index) => {
                const landed = activePhase >= index + 1;
                return (
                  <div
                    key={index}
                    data-priority
                    className="relative flex h-7 items-center gap-2.5 rounded-lg border border-white/10 bg-white/8 px-2.5 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                    style={{
                      opacity: landed ? 1 : 0.55,
                      transform: landed
                        ? "translate(0px, 0px) rotate(0deg) scaleX(1) scaleY(1)"
                        : `translate(${priority.dx}px, ${priority.dy}px) rotate(${priority.rotate}deg) scaleX(0.32) scaleY(0.26)`,
                    }}
                  >
                    {/* The lit face sits on top of the plain one and only its
                        opacity moves, so a landing never costs a repaint of the
                        border and the shadow. */}
                    <span
                      className="pointer-events-none absolute inset-0 rounded-lg border border-ember-500/40 bg-ember-500/10 shadow-[0_0_24px_-10px_#ff7a18] transition-opacity duration-500 motion-reduce:transition-none"
                      style={{ opacity: landed ? 1 : 0 }}
                    />
                    {/* Hidden while the row is still a chip: a rank and a label
                        squeezed to a third of their width would read as noise,
                        and a raw idea has neither yet. */}
                    <span
                      className="relative flex flex-1 items-center gap-2.5 transition-opacity duration-500 motion-reduce:transition-none"
                      style={{ opacity: landed ? 1 : 0 }}
                    >
                      <span className="font-display text-[0.7rem] text-ember-400 tabular-nums">
                        {index + 1}
                      </span>
                      <span
                        className="block h-1.5 rounded-full bg-ember-300/60"
                        style={{ width: `${52 - index * 5}%` }}
                      />
                      <span className="block h-1 flex-1 rounded-full bg-white/10" />
                    </span>
                  </div>
                );
              })}
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
