"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./logo";
import { switchLocalePath } from "@/lib/routes";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/content";

type Props = {
  locale: Locale;
  nav: Dictionary["nav"];
};

export function SiteHeader({ locale, nav }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const other: Locale = locale === "fr" ? "en" : "fr";
  const otherHref = switchLocalePath(pathname, locale, other);

  const links = [
    { href: `/${locale}#services`, label: nav.services },
    { href: `/${locale}#methode`, label: nav.method },
    { href: `/${locale}#chiffres`, label: nav.figures },
    { href: `/${locale}#contact`, label: nav.contact },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "border-b border-white/8 bg-ink-950/85 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-bone-300 transition-colors hover:text-bone-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={otherHref}
            hrefLang={other}
            className="hidden rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-bone-300 transition-colors hover:border-ember-400/40 hover:text-bone-50 sm:inline-flex"
          >
            {other.toUpperCase()}
          </Link>

          <Link
            href={`/${locale}#contact`}
            className="hidden rounded-full bg-linear-to-r from-ember-500 to-ember-600 px-5 py-2.5 text-sm font-medium text-ink-950 shadow-[0_10px_30px_-14px_rgba(255,122,24,0.9)] transition-all hover:from-ember-400 hover:to-ember-500 lg:inline-flex"
          >
            {nav.cta}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? nav.close : nav.menu}
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-bone-100 transition-colors hover:border-ember-400/40 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="border-t border-white/8 bg-ink-950/95 backdrop-blur-xl lg:hidden"
          onClick={() => setOpen(false)}
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-6 sm:px-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 font-display text-lg text-bone-100 transition-colors hover:bg-white/5 hover:text-ember-300"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/${locale}#contact`}
                className="flex-1 rounded-full bg-linear-to-r from-ember-500 to-ember-600 px-5 py-3 text-center text-sm font-medium text-ink-950"
              >
                {nav.cta}
              </Link>
              <Link
                href={otherHref}
                hrefLang={other}
                className="rounded-full border border-white/12 px-5 py-3 text-sm text-bone-200"
              >
                {other.toUpperCase()}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
