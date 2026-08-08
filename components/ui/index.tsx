import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-[0.7rem] font-medium tracking-[0.22em] text-ember-400 uppercase">
      <span className="h-px w-6 bg-ember-500/60" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <div
      className={
        centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"
      }
    >
      {eyebrow ? (
        <div className={centered ? "flex justify-center" : ""}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      ) : null}
      <h2 className="mt-5 font-display text-3xl leading-[1.15] font-semibold text-balance text-bone-50 sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-[1.02rem] leading-relaxed text-bone-300">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "ghost";
  withArrow?: boolean;
};

export function ButtonLink({
  variant = "primary",
  withArrow = false,
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ember-400";

  const styles =
    variant === "primary"
      ? "bg-linear-to-r from-ember-500 to-ember-600 text-ink-950 shadow-[0_10px_36px_-12px_rgba(255,122,24,0.75)] hover:from-ember-400 hover:to-ember-500 hover:shadow-[0_14px_44px_-10px_rgba(255,122,24,0.85)]"
      : "border border-white/12 bg-white/[0.03] text-bone-100 hover:border-ember-400/40 hover:bg-white/[0.06] hover:text-bone-50";

  return (
    <Link className={`${base} ${styles} ${className}`} {...props}>
      {children}
      {withArrow ? (
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      ) : null}
    </Link>
  );
}

/** Ambient forge glow used behind hero and CTA sections. */
export function ForgeGlow({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute top-[-18%] left-1/2 h-[38rem] w-[62rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,122,24,0.16),transparent_65%)] blur-2xl animate-ember-drift" />
      <div className="absolute bottom-[-30%] left-[8%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(226,87,30,0.12),transparent_70%)] blur-3xl" />
    </div>
  );
}
