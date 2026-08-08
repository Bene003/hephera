"use client";

import React from "react";
import ParticleSphereAnimation from "@/components/ui/orbiting-circles-02-utils/particalsphear";

type Orbit = {
  size: string;
  duration: number;
  icons: { src: string; alt: string; invert?: boolean }[];
};

const orbits: Orbit[] = [
  {
    size: "w-[26rem] h-[26rem] md:w-[52rem] md:h-[52rem]",
    duration: 26,
    icons: [
      { src: "/logos/react.svg", alt: "React" },
      { src: "/logos/supabase.svg", alt: "Supabase" },
      { src: "/logos/stripe.svg", alt: "Stripe" },
      { src: "/logos/tailwindcss.svg", alt: "Tailwind CSS" },
      { src: "/logos/vercel.svg", alt: "Vercel" },
    ],
  },
  {
    size: "w-[34rem] h-[34rem] md:w-[68rem] md:h-[68rem]",
    duration: 34,
    icons: [
      { src: "/logos/google.svg", alt: "Google" },
      { src: "/logos/shopify.svg", alt: "Shopify" },
      { src: "/logos/wordpress.svg", alt: "WordPress" },
      { src: "/logos/figma.svg", alt: "Figma" },
      { src: "/logos/notion.svg", alt: "Notion" },
    ],
  },
  {
    size: "w-[42rem] h-[42rem] md:w-[82rem] md:h-[82rem]",
    duration: 42,
    icons: [
      { src: "/logos/clude.svg", alt: "Claude" },
      { src: "/logos/openai.svg", alt: "OpenAI", invert: true },
      { src: "/logos/make.svg", alt: "Make" },
      { src: "/logos/n8n.svg", alt: "n8n" },
      { src: "/logos/python.svg", alt: "Python" },
    ],
  },
];

export default function OrbitingCirclesGlobe() {
  return (
    <div className="relative flex h-[22rem] w-full justify-center overflow-hidden md:h-[42rem]">
      <style>{`
        @keyframes orbit-cw {
          from { transform: rotate(var(--start-angle)) }
          to   { transform: rotate(calc(var(--start-angle) + 360deg)) }
        }
        @keyframes orbit-ccw {
          from { transform: rotate(var(--start-angle)) }
          to   { transform: rotate(calc(var(--start-angle) - 360deg)) }
        }
        @keyframes counter-cw {
          from { transform: rotate(var(--counter-offset, 0deg)) }
          to   { transform: rotate(calc(var(--counter-offset, 0deg) - 360deg)) }
        }
        @keyframes counter-ccw {
          from { transform: rotate(var(--counter-offset, 0deg)) }
          to   { transform: rotate(calc(var(--counter-offset, 0deg) + 360deg)) }
        }
        @media (prefers-reduced-motion: reduce) {
          .orbit-ring *, .orbit-ring { animation: none !important }
        }
      `}</style>

      {/* Center particle globe */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 aspect-square w-95 -translate-x-1/2 translate-y-[38%] md:w-190">
        <ParticleSphereAnimation />
      </div>

      {/* Orbiting rings */}
      {orbits.map((orbit, index) => {
        const isCW = index % 2 === 0;
        const orbitAnim = isCW ? "orbit-cw" : "orbit-ccw";
        const counterAnim = isCW ? "counter-cw" : "counter-ccw";

        // Mirror the set so the ring stays populated across the full width,
        // then spread everything evenly around it.
        const ringIcons = [
          ...orbit.icons,
          ...orbit.icons.map((icon) => ({ ...icon, alt: `${icon.alt}-2` })),
        ];
        const step = 360 / ringIcons.length;
        const allIcons = ringIcons.map((icon, iconIndex) => ({
          ...icon,
          angle: Math.round(iconIndex * step - 180),
        }));

        return (
          <div
            key={orbit.size}
            className={`orbit-ring absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border border-white/10 ${orbit.size}`}
          >
            {allIcons.map((iconData) => (
              <div
                key={iconData.alt}
                className="absolute top-0 left-1/2 -ml-8 flex h-1/2 origin-bottom flex-col items-center justify-start"
                style={
                  {
                    "--start-angle": `${iconData.angle}deg`,
                    animation: `${orbitAnim} ${orbit.duration}s linear infinite`,
                  } as React.CSSProperties
                }
              >
                <div
                  className="relative z-10 -mt-8 rounded-full border border-white/10 bg-ink-900 p-3 shadow-[0_8px_28px_-14px_rgba(255,122,24,0.6)] sm:p-4"
                  style={
                    {
                      "--counter-offset": `${-iconData.angle}deg`,
                      animation: `${counterAnim} ${orbit.duration}s linear infinite`,
                    } as React.CSSProperties
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={iconData.src}
                    alt=""
                    width={32}
                    height={32}
                    className={`size-6 md:size-8 ${iconData.invert ? "brightness-0 invert" : ""}`}
                    aria-hidden
                  />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
