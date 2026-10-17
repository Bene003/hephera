"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Map as IconeCarte } from "lucide-react";
import { ouvrirCarte } from "./carte";
import { Wordmark } from "./logo";
import { switchLocalePath } from "@/lib/routes";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/content";

type Props = {
  locale: Locale;
  nav: Dictionary["nav"];
};

/**
 * The bar holds only the map: every place of the site (services, the Labs tower, about, contact)
 * is reached from the city map (components/carte.tsx). Same bar on desktop and mobile.
 */
export function SiteHeader({ locale, nav }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const other: Locale = locale === "fr" ? "en" : "fr";
  const otherHref = switchLocalePath(pathname, locale, other);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-white/8 bg-ink-950/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={ouvrirCarte}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ember-400/40 bg-ember-500/10 px-4 text-sm font-medium text-bone-50 shadow-[0_10px_30px_-16px_rgba(255,122,24,0.9)] transition-colors hover:border-ember-400/70 hover:bg-ember-500/20 focus-visible:outline-2 focus-visible:outline-ember-400"
          >
            <IconeCarte className="size-4" aria-hidden />
            {nav.carte}
          </button>
          <Link
            href={otherHref}
            hrefLang={other}
            className="inline-flex min-h-10 items-center rounded-full border border-white/10 px-3.5 text-xs font-medium tracking-wide text-bone-300 transition-colors hover:border-ember-400/40 hover:text-bone-50"
          >
            {other.toUpperCase()}
          </Link>
        </div>
      </div>
    </header>
  );
}
