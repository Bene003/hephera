"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Bell,
  CreditCard,
  FileText,
  Mail,
  MousePointer2,
  Send,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { AnimatedBeam } from "../animated-beam";
import { lerp, mapRange, useReducedMotionPref } from "../motion-utils";
import type { ServiceSceneProps } from ".";

/**
 * Same two constants as the web scene, for the same reason: if an ancestor ever
 * breaks `position: sticky`, the pin is traded for the in-viewport model by
 * editing these (track `h-auto`, stage `relative`, `["start end", "end start"]`).
 */
const TRACK_HEIGHT = "h-[300svh] sm:h-[290vh]";
const SCROLL_OFFSET: ["start start", "end end"] = ["start start", "end end"];

/** Where the diagram stops reading as manual: every inbound wire has landed. */
const BROKEN_UNTIL = 0.44;

/**
 * The wiring order is the whole argument: work arrives on the left, the hub
 * takes it, and only then does anything leave on the right. Lighting an outbound
 * beam before the inbound ones would say the tools talk to each other directly,
 * which is exactly the mess we are selling a way out of.
 */
const INBOUND_AT = [0.15, 0.24, 0.33];
const HUB_AT = 0.38;
const OUTBOUND_AT = [0.48, 0.57, 0.66];


function Node({
  icon: NodeIcon,
  lightAt,
  progress,
  reduced,
  nodeRef,
  hub = false,
}: {
  icon: LucideIcon;
  lightAt: number;
  progress: MotionValue<number>;
  reduced: boolean;
  nodeRef: RefObject<HTMLDivElement | null>;
  hub?: boolean;
}) {
  const lit = useTransform(() =>
    mapRange(progress.get(), [lightAt, lightAt + 0.12], [0, 1]),
  );
  // Called for every node, hub included, so the hook count cannot depend on
  // which nodes end up carrying a cursor.
  const manual = useTransform(() =>
    mapRange(progress.get(), [0.12, 0.4], [1, 0]),
  );

  return (
    <div
      ref={nodeRef}
      className={`relative z-10 flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-ink-850 ${
        hub ? "size-16 sm:size-20" : "size-11 sm:size-12"
      }`}
    >
      {/* The lit face sits on top of the dull one and only its opacity moves:
          animating a colour or a filter would cost a paint on every frame. */}
      <motion.span
        aria-hidden
        style={reduced ? { opacity: 1 } : { opacity: lit }}
        className="absolute inset-0 rounded-2xl border border-ember-500/40 bg-ember-500/10 shadow-[0_0_24px_-8px_#ff7a18]"
      />
      <motion.span
        style={reduced ? { opacity: 1 } : { opacity: lit }}
        className="absolute text-ember-400"
      >
        <NodeIcon className={hub ? "size-7" : "size-4.5"} strokeWidth={1.6} />
      </motion.span>
      <span className="text-bone-500">
        <NodeIcon className={hub ? "size-7" : "size-4.5"} strokeWidth={1.6} />
      </span>

      {/* Before only: the cursor that says a person is doing this by hand. Its
          resting CSS state is invisible, so reduced motion lands on the fixed
          diagram rather than on the manual one. */}
      {!hub && lightAt < HUB_AT && (
        <motion.span
          style={reduced ? { opacity: 0 } : { opacity: manual }}
          className="absolute -top-1.5 -right-1.5"
        >
          <span className="animate-svcauto-manual block text-bone-400 opacity-0">
            <MousePointer2 className="size-3" strokeWidth={2} />
          </span>
        </motion.span>
      )}
    </div>
  );
}

function Beam({
  containerRef,
  fromRef,
  toRef,
  at,
  progress,
  reduced,
  reverse = false,
  index,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  fromRef: RefObject<HTMLDivElement | null>;
  toRef: RefObject<HTMLDivElement | null>;
  at: number;
  progress: MotionValue<number>;
  reduced: boolean;
  reverse?: boolean;
  index: number;
}) {
  const opacity = useTransform(() =>
    mapRange(progress.get(), [at, at + 0.1], [0, 1]),
  );

  return (
    <motion.div
      aria-hidden
      style={reduced ? { opacity: 1 } : { opacity }}
      className="pointer-events-none absolute inset-0"
    >
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={fromRef}
        toRef={toRef}
        reverse={reverse}
        paused={reduced}
        duration={4.5}
        delay={index * 0.6}
      />
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

export function AutomationFlowScene({
  scene,
  beforeLabel,
  afterLabel,
  scrollHint,
}: ServiceSceneProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();

  // Named one by one rather than collected in an array: `react-hooks/refs`
  // forbids indexing or mapping a list of refs during render, and a diagram
  // whose nodes each mean something specific reads better named anyway.
  const mailRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);
  const crmRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: SCROLL_OFFSET,
  });

  // Function form only. Passing ranges directly lets framer hand the property to
  // a native ScrollTimeline, which then desynchronises from the JS-driven parts.
  const railScaleX = useTransform(() =>
    mapRange(scrollYProgress.get(), [0, 1], [0, 1]),
  );
  const backlog = useTransform(() =>
    mapRange(scrollYProgress.get(), [0.12, 0.4], [1, 0]),
  );
  const hubGlow = useTransform(() =>
    mapRange(scrollYProgress.get(), [HUB_AT, 0.85], [0, 0.75]),
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

  // Every problem is stated while the diagram is still manual, every answer once
  // the wiring is up. The DOM keeps the pairs adjacent so the reduced-motion
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

  // Plain JSX builders, not components: they only spread the props every node
  // and beam shares, so no hook is ever created or skipped here.
  const node = (
    icon: LucideIcon,
    nodeRef: RefObject<HTMLDivElement | null>,
    lightAt: number,
    hub = false,
  ) => (
    <Node
      icon={icon}
      nodeRef={nodeRef}
      lightAt={lightAt}
      hub={hub}
      progress={scrollYProgress}
      reduced={reduced}
    />
  );

  const beam = (
    fromRef: RefObject<HTMLDivElement | null>,
    toRef: RefObject<HTMLDivElement | null>,
    at: number,
    index: number,
  ) => (
    <Beam
      containerRef={containerRef}
      fromRef={fromRef}
      toRef={toRef}
      at={at}
      index={index}
      progress={scrollYProgress}
      reduced={reduced}
    />
  );

  return (
    <div
      ref={trackRef}
      data-scene="automation-flow"
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
            style={reduced ? { opacity: 0.75 } : { opacity: hubGlow }}
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,122,24,0.22),transparent_65%)] blur-2xl"
          />

          <div
            ref={containerRef}
            className="relative h-[216px] w-[min(92vw,560px)] sm:h-[248px]"
          >
            <div className="flex h-full items-center justify-between">
              <div className="flex h-full flex-col justify-between">
                {node(Mail, mailRef, INBOUND_AT[0])}
                {node(FileText, formRef, INBOUND_AT[1])}
                {node(CreditCard, paymentRef, INBOUND_AT[2])}
              </div>

              {node(Zap, hubRef, HUB_AT, true)}

              <div className="flex h-full flex-col justify-between">
                {node(Users, crmRef, OUTBOUND_AT[0])}
                {node(Send, replyRef, OUTBOUND_AT[1])}
                {node(Bell, reportRef, OUTBOUND_AT[2])}
              </div>
            </div>

            {beam(mailRef, hubRef, INBOUND_AT[0], 0)}
            {beam(formRef, hubRef, INBOUND_AT[1], 1)}
            {beam(paymentRef, hubRef, INBOUND_AT[2], 2)}
            {beam(hubRef, crmRef, OUTBOUND_AT[0], 3)}
            {beam(hubRef, replyRef, OUTBOUND_AT[1], 4)}
            {beam(hubRef, reportRef, OUTBOUND_AT[2], 5)}

            {/* Before only: the queue that builds up while a human is the
                integration. Base opacity is 0, so the reduced-motion poster is
                the cleared backlog. */}
            <motion.div
              style={reduced ? undefined : { opacity: backlog }}
              className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-1.5"
            >
              {[0, 1, 2].map((bar) => (
                <span
                  key={bar}
                  className="animate-svcauto-pile h-1 w-8 rounded-full bg-ember-600 opacity-0"
                  style={{ animationDelay: `${bar * 260}ms` }}
                />
              ))}
            </motion.div>
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
