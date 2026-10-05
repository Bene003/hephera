"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { aProposSlug } from "@/lib/a-propos-slug";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const panneauRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Opening slides the whole page aside (html[data-menu="open"] .page-shell
  // in globals.css). The page scales around the middle of the screen, not the
  // middle of the document, so the visible part stays put.
  useEffect(() => {
    const html = document.documentElement;
    const shell = document.getElementById("page-shell");
    if (!open) {
      delete html.dataset.menu;
      document.body.style.overflow = "";
      return;
    }
    html.style.setProperty("--menu-origine", `${window.scrollY + window.innerHeight / 2}px`);
    html.dataset.menu = "open";
    document.body.style.overflow = "hidden";

    const fermer = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    const grand = window.matchMedia("(min-width: 64rem)");
    const onGrand = () => grand.matches && fermer();
    // A click anywhere on the pushed-aside page closes the menu.
    const onShell = (e: MouseEvent) => {
      if (boutonRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      fermer();
    };

    window.addEventListener("keydown", onKey);
    grand.addEventListener("change", onGrand);
    shell?.addEventListener("click", onShell, true);
    panneauRef.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });

    return () => {
      window.removeEventListener("keydown", onKey);
      grand.removeEventListener("change", onGrand);
      shell?.removeEventListener("click", onShell, true);
    };
  }, [open]);

  // The menu's background video: fetched on first opening only (176 KB),
  // playing while the menu is open, paused when it closes. With reduced
  // motion it stays on its first frame.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!open) {
      const id = window.setTimeout(() => video.pause(), 550);
      return () => window.clearTimeout(id);
    }
    if (!video.getAttribute("src")) video.src = "/videos/menu.mp4";
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.play().catch(() => {});
    }
  }, [open, mounted]);

  // Back to normal on navigation, focus back on the button.
  useEffect(() => {
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const other: Locale = locale === "fr" ? "en" : "fr";
  const otherHref = switchLocalePath(pathname, locale, other);

  const links = [
    { href: `/${locale}#services`, label: nav.services },
    { href: `/${locale}#methode`, label: nav.method },
    { href: `/${locale}#chiffres`, label: nav.figures },
    { href: `/${locale}/${aProposSlug[locale]}`, label: nav.about },
    { href: `/${locale}#contact`, label: nav.contact },
  ];

  const fermerEtRendreLeFocus = () => {
    setOpen(false);
    boutonRef.current?.focus({ preventScroll: true });
  };

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
            ref={boutonRef}
            type="button"
            onClick={() => (open ? fermerEtRendreLeFocus() : setOpen(true))}
            aria-expanded={open}
            aria-controls="menu-lateral"
            aria-label={open ? nav.close : nav.menu}
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 text-bone-100 transition-colors hover:border-ember-400/40 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* The side menu lives outside the page shell (portal): it sits behind
          the page and is revealed when the page slides aside. */}
      {mounted
        ? createPortal(
            <div
              id="menu-lateral"
              ref={panneauRef}
              role="dialog"
              aria-modal="true"
              aria-label={nav.menu}
              aria-hidden={!open}
              inert={!open}
              data-ouvert={open ? "" : undefined}
              className="menu-cyber fixed inset-y-0 right-0 z-0 isolate flex w-[min(18rem,78vw)] flex-col overflow-hidden lg:hidden"
            >
              {/* Full immersion: light streams behind the menu, with a veil
                  that keeps the links readable over the bright centre. */}
              <video
                ref={videoRef}
                muted
                loop
                playsInline
                preload="none"
                poster="/images/menu-debut.jpg"
                aria-hidden="true"
                className="absolute inset-0 -z-10 size-full object-cover"
              />
              <span aria-hidden="true" className="menu-cyber-voile absolute inset-0 -z-10" />
              <div className="flex items-center justify-between px-6 pt-6">
                <span className="font-mono text-[0.65rem] tracking-[0.3em] text-cyan-300/70 uppercase">
                  {"// nav.sys"}
                </span>
                <button
                  type="button"
                  onClick={fermerEtRendreLeFocus}
                  aria-label={nav.close}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 text-bone-200 transition-colors hover:border-cyan-300/50 hover:text-cyan-200"
                >
                  <X className="size-4" />
                </button>
              </div>

              <nav className="mt-10 flex flex-col gap-1 px-4">
                {links.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    style={{ ["--rang" as string]: i }}
                    className="menu-cyber-lien group flex items-baseline gap-4 rounded-lg px-3 py-3 font-display text-lg text-bone-100 focus-visible:outline-2 focus-visible:outline-cyan-300"
                  >
                    <span className="font-mono text-[0.65rem] text-ember-400/80">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="menu-cyber-texte">{link.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto flex items-center gap-3 px-6 pb-8">
                <Link
                  href={`/${locale}#contact`}
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full bg-linear-to-r from-ember-500 to-ember-600 px-5 py-3 text-center text-sm font-medium text-ink-950"
                >
                  {nav.cta}
                </Link>
                <Link
                  href={otherHref}
                  hrefLang={other}
                  className="rounded-full border border-white/12 px-4 py-3 text-sm text-bone-200"
                >
                  {other.toUpperCase()}
                </Link>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
