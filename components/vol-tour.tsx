"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Phase = "repos" | "plonge" | "arrive";

const LABS = /^\/(fr|en)\/labs\/?$/;

/**
 * The flight into the tower. Any way into the Labs (menu, footer, the city's « Enter the tower »,
 * the map) dives forward: the page rushes in and blurs while the first frame of the Labs journey,
 * the approach to that very tower, fades in on top. The Labs page opens underneath (no reload, it
 * starts on that same frame), then the frame dissolves into it. Mounted in the layout, so it
 * outlives the page change. Reduced motion: a plain navigation.
 */
export function VolTour() {
  const router = useRouter();
  const chemin = usePathname();
  const [phase, setPhase] = useState<Phase>("repos");
  const [mobile, setMobile] = useState(false);
  const cible = useRef<string | null>(null);

  const lancer = useCallback(
    (href: string) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }
      cible.current = href.split(/[?#]/)[0];
      setMobile(window.matchMedia("(max-width: 47.99rem)").matches);
      // The page dives toward the upper middle of the view, where the tower stands in the frame.
      document.documentElement.style.setProperty("--vol-origine", `${window.scrollY + window.innerHeight * 0.4}px`);
      setPhase("plonge");
      router.prefetch(href);
      window.setTimeout(() => router.push(href, { scroll: true }), 820);
    },
    [router],
  );

  useEffect(() => {
    const surClic = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || !LABS.test(url.pathname) || url.pathname === window.location.pathname) return;
      e.preventDefault();          // before Next's own Link handler (we listen in the capture phase)
      e.stopPropagation();
      lancer(url.pathname + url.search + url.hash);
    };
    const surDemande = (e: Event) => lancer((e as CustomEvent<{ href: string }>).detail.href);
    document.addEventListener("click", surClic, true);
    window.addEventListener("vol:tour", surDemande);
    return () => {
      document.removeEventListener("click", surClic, true);
      window.removeEventListener("vol:tour", surDemande);
    };
  }, [lancer]);

  // Landed: the Labs page is there, under the frame. Let it show through.
  useEffect(() => {
    if (phase !== "plonge" || !cible.current || chemin !== cible.current) return;
    // The new page must start at its very top (its own camera reads the scroll) before it shows through.
    window.scrollTo(0, 0);
    const recaler = window.setInterval(() => window.scrollY !== 0 && window.scrollTo(0, 0), 50);
    const a = window.setTimeout(() => {
      window.clearInterval(recaler);
      setPhase("arrive");
    }, 950);
    const b = window.setTimeout(() => {
      setPhase("repos");
      cible.current = null;
    }, 1900);
    return () => {
      window.clearInterval(recaler);
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [chemin, phase]);

  useEffect(() => {
    const html = document.documentElement;
    if (phase === "repos") delete html.dataset.vol;
    else html.dataset.vol = phase;
  }, [phase]);

  return (
    <div aria-hidden className="vol-tour pointer-events-none fixed inset-0 z-[90]" data-phase={phase}>
      {phase !== "repos" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mobile ? "/labs/tour/v3/mobile/depart.jpg" : "/labs/tour/v3/A.jpg"} alt="" className="size-full object-cover" />
      )}
    </div>
  );
}
