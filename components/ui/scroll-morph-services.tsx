"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, MousePointerClick, X } from "lucide-react";

export interface ScrollMorphItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
  icon?: ReactNode;
  loop?: ReactNode;
}

export interface ScrollMorphServicesProps {
  items: ScrollMorphItem[];
  eyebrow: string;
  title: string;
  subtitle: string;
  scrollHint: string;
  cta: string;
  closeLabel: string;
  clickHint: string;
}

/** scatter → line → circle plays once on entry, then the scroll morphs circle → arc. */
type IntroPhase = "scatter" | "line" | "circle";

const lerp = (from: number, to: number, t: number) => from * (1 - t) + to * t;
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** Deterministic pseudo-random so the server and the client agree on the scatter. */
const seeded = (seed: number) => {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
};

const reducedMotionQuery = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)");
const subscribeReducedMotion = (onChange: () => void) => {
  const query = reducedMotionQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

export function ScrollMorphServices({
  items,
  eyebrow,
  title,
  subtitle,
  scrollHint,
  cta,
  closeLabel,
  clickHint,
}: ScrollMorphServicesProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [introPhase, setIntroPhase] = useState<IntroPhase>("scatter");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [morph, setMorph] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => reducedMotionQuery().matches,
    () => false,
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timers.push(setTimeout(() => setIntroPhase("line"), 300));
        timers.push(setTimeout(() => setIntroPhase("circle"), 1300));
      },
      { threshold: 0.1 },
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  // The composition takes about 60vh of scroll, then a short plateau lets the
  // cards be explored before the stage leaves. The section used to be 340vh
  // with the composition done at a third: two screens of scrolling where
  // nothing moved.
  const morphProgress = useTransform(scrollYProgress, [0.05, 0.55], [0, 1]);
  const smoothMorph = useSpring(morphProgress, {
    stiffness: 60,
    damping: 22,
    mass: 0.4,
  });
  useMotionValueEvent(smoothMorph, "change", (value) => {
    setMorph(value);
    if (value < 0.88) {
      // Close a detail card when the visitor rewinds the composition, while
      // keeping every card face-down and ready to be explored.
      setOpenId(null);
    }
  });

  const pointerX = useMotionValue(0);
  const parallaxX = useSpring(pointerX, { stiffness: 30, damping: 20 });
  const parallaxOffset = useTransform(parallaxX, (value) => value * 36);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onMove = (event: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    };
    stage.addEventListener("mousemove", onMove);
    return () => stage.removeEventListener("mousemove", onMove);
  }, [pointerX]);

  const scatter = useMemo(
    () =>
      items.map((_, index) => ({
        x: (seeded(index + 1) - 0.5) * 900,
        y: (seeded(index + 11) - 0.5) * 520,
        rotation: (seeded(index + 21) - 0.5) * 140,
      })),
    [items],
  );

  const isMobile = size.width > 0 && size.width < 768;
  const cardWidth = isMobile ? 96 : 176;
  const cardHeight = isMobile ? 132 : 232;
  const count = items.length;

  const positionOf = (index: number) => {
    if (introPhase === "scatter") {
      return { ...scatter[index], scale: 0.7, opacity: 0 };
    }

    if (introPhase === "line") {
      const gap = isMobile ? cardWidth * 0.6 : cardWidth + 28;
      return {
        x: (index - (count - 1) / 2) * gap,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
      };
    }

    const radius = Math.min(
      Math.min(size.width, size.height) * 0.3,
      isMobile ? 118 : 210,
    );
    const angle = (index / count) * 360 - 90;
    const radians = (angle * Math.PI) / 180;
    const circle = {
      x: Math.cos(radians) * radius,
      y: Math.sin(radians) * radius,
      rotation: (index - (count - 1) / 2) * 8,
    };

    // Rainbow arc: a parabola is easier to keep on screen than a huge circle.
    const spread = Math.min(size.width * (isMobile ? 0.68 : 0.74), 820);
    const offset = count === 1 ? 0 : index / (count - 1) - 0.5;
    const arc = {
      x: offset * spread,
      y:
        size.height * (isMobile ? 0.14 : 0.13) +
        (offset * 2) ** 2 * (isMobile ? 40 : 84),
      rotation: offset * 2 * (isMobile ? 6 : 12),
    };

    return {
      x: lerp(circle.x, arc.x, morph),
      y: lerp(circle.y, arc.y, morph),
      rotation: lerp(circle.rotation, arc.rotation, morph),
      scale: lerp(1, isMobile ? 0.95 : 1.06, morph),
      opacity: 1,
    };
  };

  const introOpacity = introPhase === "circle" ? clamp01(1 - morph * 2.2) : 0;
  const arcOpacity = clamp01((morph - 0.55) / 0.4);

  return (
    <div ref={sectionRef} className="relative h-[220vh]">
      <div
        ref={stageRef}
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden"
      >
        <span className="absolute top-24 text-[0.7rem] font-medium tracking-[0.16em] text-bone-500 uppercase sm:top-28">
          {eyebrow}
        </span>

        <motion.div
          animate={{ opacity: introOpacity }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute z-0 flex max-w-3xl flex-col items-center px-6 text-center"
        >
          <h2 className="font-display text-3xl leading-tight font-semibold text-balance text-bone-50 sm:text-5xl">
            {title}
          </h2>
          <span className="mt-6 text-[0.7rem] font-medium tracking-[0.2em] text-ember-400/80 uppercase">
            {scrollHint}
          </span>
        </motion.div>

        <motion.div
          animate={{
            opacity: introPhase !== "scatter" && openId === null ? 1 : 0,
            y: introPhase !== "scatter" && openId === null ? 0 : 8,
          }}
          transition={{ duration: reduced ? 0 : 0.35 }}
          aria-hidden={openId !== null}
          className="pointer-events-none absolute bottom-[5%] z-40 inline-flex items-center gap-2 rounded-full border border-ember-500/35 bg-ink-950/85 px-3 py-2 text-[0.62rem] font-medium tracking-[0.12em] text-ember-300 uppercase shadow-[0_0_28px_rgba(255,122,24,0.16)] backdrop-blur-sm sm:bottom-[7%] sm:text-[0.68rem]"
        >
          <span className="relative inline-flex size-5 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-ember-500/25 motion-reduce:animate-none" />
            <MousePointerClick className="relative size-3.5 animate-pulse motion-reduce:animate-none" />
          </span>
          {clickHint}
        </motion.div>

        <motion.div
          animate={{ opacity: arcOpacity, y: (1 - arcOpacity) * 16 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute top-[22%] z-20 max-w-2xl px-6 text-center"
        >
          <h2 className="font-display text-2xl font-semibold text-balance text-bone-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-bone-300 sm:text-base">
            {subtitle}
          </p>
        </motion.div>

        <motion.div
          style={{ x: parallaxOffset }}
          // Above the arc heading (z-20), which overlaps the cards on mobile.
          className="relative z-30 flex h-full w-full items-center justify-center"
        >
          {items.map((item, index) => (
            <MorphCard
              key={item.id}
              item={item}
              index={index}
              target={positionOf(index)}
              width={cardWidth}
              height={cardHeight}
              isMobile={isMobile}
              isOpen={openId === item.id}
              onToggle={() =>
                setOpenId((current) => (current === item.id ? null : item.id))
              }
              cta={cta}
              closeLabel={closeLabel}
              reduced={reduced}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

interface MorphCardProps {
  item: ScrollMorphItem;
  index: number;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
  width: number;
  height: number;
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
  cta: string;
  closeLabel: string;
  reduced: boolean;
}

/**
 * A card has two faces but three states: 0° the title, 180° the live loop
 * ("à l'envers", where the arc parks), 360° the description + link. The front
 * face swaps its content while it points away from the viewer, so the change is
 * never visible.
 */
function MorphCard({
  item,
  index,
  target,
  width,
  height,
  isMobile,
  isOpen,
  onToggle,
  cta,
  closeLabel,
  reduced,
}: MorphCardProps) {
  // Cards are already face-down when they enter the viewport: visitors see
  // the live service loops before doing any scrolling in this section.
  const rotateY = useMotionValue(180);
  const [phase, setPhase] = useState({ detail: true, backLive: true });
  const phaseRef = useRef(phase);

  // Keyed off the real rotation rather than off `isOpen`, because closing
  // travels 360°→180° with the front face visible for the first half of it.
  useMotionValueEvent(rotateY, "change", (value) => {
    const next = {
      detail: value >= 180,
      // Mount the looping illustration only while its face can be seen.
      backLive: value > 60 && value < 300,
    };
    if (
      next.detail === phaseRef.current.detail &&
      next.backLive === phaseRef.current.backLive
    )
      return;
    phaseRef.current = next;
    setPhase(next);
  });

  const rotation = 180 + (isOpen ? 180 : 0);
  const previousRotation = useRef(rotation);

  useEffect(() => {
    // Only the reveal turn staggers; a click has to answer immediately.
    const isReveal = previousRotation.current === 0 && rotation === 180;
    previousRotation.current = rotation;
    const controls = animate(rotateY, rotation, {
      duration: reduced ? 0 : 0.55,
      // A tween never overshoots the 180° backface boundary, which is what
      // made the hidden face flicker back when this was a spring.
      ease: [0.22, 1, 0.36, 1],
      delay: isReveal && !reduced ? index * 0.09 : 0,
    });
    return () => controls.stop();
  }, [rotateY, rotation, reduced, index]);

  const openScale = isOpen ? (isMobile ? 1.75 : 1.15) : 1;
  const overlay =
    "absolute inset-0 z-20 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400";

  return (
    <motion.div
      animate={{
        // A 96px card blown up 1.75× at the end of the arc would hang off the
        // viewport, so on mobile the open card comes to the middle instead.
        x: isOpen && isMobile ? 0 : target.x,
        y: target.y - (isOpen ? (isMobile ? 10 : 8) : 0),
        // The open card straightens out of the arc's tilt so it can be read.
        rotate: isOpen ? 0 : target.rotation,
        scale: target.scale * openScale,
        opacity: target.opacity,
      }}
      transition={{ type: "spring", stiffness: 45, damping: 16 }}
      className="group"
      style={{
        position: "absolute",
        width,
        height,
        // 1000px on a 96px-wide card reads almost orthographic.
        perspective: isMobile ? 420 : 760,
        // The arc overlaps its neighbours, so lift the open card clear.
        zIndex: isOpen ? 40 : 2,
      }}
    >
      {/* pointer-events-none also neutralises .card-forge:hover's translateY,
          which would fight the flip. The lit edge comes back via `group`. */}
      <motion.div
        className="pointer-events-none relative h-full w-full"
        style={{ transformStyle: "preserve-3d", rotateY }}
      >
        {/* bg-ink-900 matches the back face: .card-forge alone is pure
            translucent gradient, so the arc's neighbours showed through. */}
        <div
          className="card-forge absolute inset-0 flex flex-col justify-end rounded-2xl bg-ink-900 p-2.5 group-hover:border-ember-500/30 md:p-4"
          style={{ backfaceVisibility: "hidden" }}
        >
          {phase.detail ? (
            <>
              <h3 className="font-display text-[0.62rem] leading-tight font-semibold text-bone-50 md:text-base">
                {item.title}
              </h3>
              <p className="mt-1 text-[0.5rem] leading-snug text-bone-300 md:mt-2 md:text-xs">
                <span className="md:hidden">{item.tagline}</span>
                <span className="hidden md:inline">{item.description}</span>
              </p>
              <span className="mt-2 inline-flex items-center gap-1 self-start rounded-full border border-ember-500/40 bg-ember-500/10 px-2 py-0.5 text-[0.5rem] font-medium text-ember-300 md:mt-3 md:px-3 md:py-1 md:text-[0.7rem]">
                {cta}
                <ArrowUpRight className="size-2.5 md:size-3" />
              </span>
            </>
          ) : (
            <>
              {item.icon ? (
                <span className="absolute top-2.5 left-2.5 inline-flex size-8 items-center justify-center rounded-lg border border-ember-500/25 bg-ember-500/10 text-ember-400 md:top-4 md:left-4 md:size-9">
                  {item.icon}
                </span>
              ) : null}
              <h3 className="font-display text-[0.58rem] leading-tight font-semibold text-bone-50 md:text-base">
                {item.title}
              </h3>
              <p className="mt-1 hidden text-[0.7rem] leading-snug text-ember-400/90 md:block">
                {item.tagline}
              </p>
            </>
          )}
        </div>

        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border border-ember-500/25 bg-ink-900 group-hover:border-ember-500/45"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="bg-anvil absolute inset-0 opacity-35" />
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 110%, rgba(255,122,26,0.18), transparent 70%)",
            }}
          />
          <div className="relative h-full w-full">
            {phase.backLive ? item.loop : null}
          </div>
        </div>
      </motion.div>

      {/* The interactive elements are siblings of the rotator: an <a> inside a
          <button> is invalid, and backface-visibility is not a hit-testing
          guarantee. Only one exists at a time, so no hidden face is focusable. */}
      {isOpen ? (
        <>
          <Link href={item.href} className={overlay}>
            <span className="sr-only">{`${item.title} — ${cta}`}</span>
          </Link>
          <button
            type="button"
            onClick={onToggle}
            aria-label={closeLabel}
            className="absolute top-1 right-1 z-30 inline-flex size-5 items-center justify-center rounded-full border border-white/10 bg-ink-950/80 text-bone-300 transition-colors hover:text-bone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400 md:top-2 md:right-2 md:size-6"
          >
            <X className="size-2.5 md:size-3" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          className={overlay}
        >
          <span className="sr-only">{item.title}</span>
        </button>
      )}
    </motion.div>
  );
}
