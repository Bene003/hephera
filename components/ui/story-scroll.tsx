"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

export interface StoryPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}

export function StoryPanel({
  children,
  className,
  style,
  "aria-label": ariaLabel,
}: StoryPanelProps) {
  return (
    <section
      data-story-panel
      aria-label={ariaLabel}
      className={cx("relative min-h-svh w-full overflow-hidden", className)}
    >
      <div
        data-story-inner
        className="relative flex min-h-svh w-full origin-bottom-left flex-col px-5 py-8 will-change-transform sm:px-[5vw] sm:py-[4vw]"
        style={style}
      >
        {children}
      </div>
    </section>
  );
}

export interface StoryScrollProps {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function StoryScroll({
  children,
  className,
  "aria-label": ariaLabel,
}: StoryScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container || reduced) return;
      gsap.registerPlugin(ScrollTrigger);

      const panels = Array.from(
        container.querySelectorAll<HTMLElement>("[data-story-panel]"),
      );
      const triggers: ScrollTrigger[] = [];

      panels.forEach((panel, index) => {
        gsap.set(panel, { zIndex: index + 1 });
        const inner = panel.querySelector<HTMLElement>("[data-story-inner]");
        if (!inner) return;

        if (index > 0) {
          gsap.set(inner, { rotation: 24, transformOrigin: "bottom left" });
          const reveal = gsap.to(inner, {
            rotation: 0,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              start: "top bottom",
              end: "top 22%",
              scrub: 0.55,
            },
          });
          if (reveal.scrollTrigger) triggers.push(reveal.scrollTrigger);
        }

        if (index < panels.length - 1) {
          triggers.push(
            ScrollTrigger.create({
              trigger: panel,
              start: "bottom bottom",
              end: "bottom top",
              pin: true,
              pinSpacing: false,
            }),
          );
        }
      });

      ScrollTrigger.refresh();
      return () => triggers.forEach((trigger) => trigger.kill());
    },
    { scope: containerRef, dependencies: [Children.count(children), reduced] },
  );

  return (
    <div
      ref={containerRef}
      aria-label={ariaLabel}
      className={cx("w-full overflow-x-clip", className)}
    >
      {children}
    </div>
  );
}
