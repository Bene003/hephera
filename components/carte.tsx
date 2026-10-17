"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

import { carteTextes, lieuDeLaPage, lieuxCarte, routeCarte } from "@/lib/carte";
import type { Locale } from "@/lib/i18n";
import { villeTextes, type LieuVille } from "@/lib/ville";

const L = 1000;
const H = 640;

/** Lit windows of the background blocks: fixed, so the city looks the same on every visit. */
const IMMEUBLES = Array.from({ length: 46 }, (_, i) => {
  const x = (i * 197) % 960 + 20;
  const y = ((i * 131) % 560) + 40;
  const w = 26 + ((i * 37) % 40);
  const h = 22 + ((i * 53) % 46);
  return { x, y, w, h, fenetres: (i * 7) % 5 };
});

/** Ask the map to open (the header's "Map" buttons, desktop and mobile). */
export function ouvrirCarte() {
  window.dispatchEvent(new Event("carte:ouvrir"));
}

/** Ask for the flight to the tower (components/vol-tour.tsx). */
export function volerVersLaTour(href: string) {
  window.dispatchEvent(new CustomEvent("vol:tour", { detail: { href } }));
}

/**
 * The city map: the homepage journey as a place you can see from above. The guide's spot pulses
 * (« you are here »); a click on a place sends you there: the camera travels on the homepage,
 * the flight takes you into the tower for the Labs.
 */
export function Carte({ locale }: { locale: Locale }) {
  const t = carteTextes[locale];
  const noms = villeTextes[locale].lieux;
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const chemin = usePathname();
  const [surAccueil, setSurAccueil] = useState<LieuVille | null>(null);
  const [survol, setSurvol] = useState<LieuVille | null>(null);
  const accueil = chemin === `/${locale}`;
  const ici: LieuVille | null = accueil ? surAccueil ?? "arrivee" : lieuDeLaPage(chemin, locale);

  useEffect(() => {
    const ouvrir = () => ref.current && !ref.current.open && ref.current.showModal();
    const lieu = (e: Event) => setSurAccueil((e as CustomEvent<LieuVille>).detail ?? null);
    window.addEventListener("carte:ouvrir", ouvrir);
    window.addEventListener("ville:lieu", lieu);
    return () => {
      window.removeEventListener("carte:ouvrir", ouvrir);
      window.removeEventListener("ville:lieu", lieu);
    };
  }, []);

  const aller = useCallback(
    (id: LieuVille) => {
      ref.current?.close();
      if (id === "tour") {
        volerVersLaTour(`/${locale}/labs`);
        return;
      }
      if (accueil) {
        const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (id === "arrivee") window.scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" });
        else document.getElementById(`ville-${id}`)?.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "start" });
        return;
      }
      router.push(id === "arrivee" ? `/${locale}` : `/${locale}#ville-${id}`);
    },
    [accueil, locale, router],
  );

  const point = (id: LieuVille) => lieuxCarte.find((l) => l.id === id)!;
  const route = routeCarte.map((id) => `${point(id).x},${point(id).y}`).join(" ");
  const actif = survol ?? ici;

  return (
    <dialog
      ref={ref}
      aria-labelledby="carte-titre"
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="carte fixed inset-0 m-auto h-[min(92dvh,46rem)] w-[min(96vw,70rem)] max-w-none overflow-hidden rounded-3xl border border-white/10 bg-ink-950 p-0 text-bone-100"
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8">
        <div>
          <h2 id="carte-titre" className="font-display text-2xl font-semibold text-bone-50 sm:text-3xl">{t.titre}</h2>
          <p className="mt-1 text-sm text-bone-300">{t.sousTitre}</p>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label={t.fermer}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-white/12 text-bone-100 transition-colors hover:border-ember-400/40 focus-visible:outline-2 focus-visible:outline-ember-400"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div
        className="relative mx-auto mt-4 w-full px-3 sm:px-6"
        // As wide as it can while the header, the caption and the button still fit in the dialog's height.
        style={{ aspectRatio: `${L} / ${H}`, maxWidth: `min(64rem, calc((min(92dvh, 46rem) - 12.5rem) * ${L / H}))` }}
      >
        <svg viewBox={`0 0 ${L} ${H}`} className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <filter id="carte-lueur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="flou" />
              <feMerge><feMergeNode in="flou" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="carte-ciel" cx="60%" cy="35%" r="75%">
              <stop offset="0" stopColor="#2a160c" />
              <stop offset="0.6" stopColor="#0d0b10" />
              <stop offset="1" stopColor="#07070a" />
            </radialGradient>
            <pattern id="carte-rues" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="rgba(255,122,24,0.07)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={L} height={H} rx="24" fill="url(#carte-ciel)" />
          <rect width={L} height={H} fill="url(#carte-rues)" />
          {/* the avenues */}
          <path d="M0 560 C 260 520, 520 600, 1000 540" stroke="rgba(255,140,60,0.18)" strokeWidth="10" fill="none" />
          <path d="M560 640 C 560 420, 700 260, 760 0" stroke="rgba(255,140,60,0.12)" strokeWidth="8" fill="none" />
          {/* the sleeping city */}
          {IMMEUBLES.map((b, i) => (
            <g key={i} opacity="0.75">
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill="#15131a" stroke="rgba(255,255,255,0.04)" />
              {Array.from({ length: b.fenetres }, (_, k) => (
                <rect key={k} x={b.x + 5 + k * 6} y={b.y + 6} width="2.5" height="3" fill="rgba(255,190,120,0.55)" />
              ))}
            </g>
          ))}

          {/* the places */}
          <g filter="url(#carte-lueur)">
            {/* the studio */}
            <rect x="85" y="440" width="70" height="56" rx="6" fill="#1d1a20" stroke="#ff9d42" strokeOpacity="0.7" />
            <rect x="113" y="470" width="14" height="26" fill="#ffc078" opacity="0.8" />
            {/* the forge: a big hall glowing from inside, its four stations */}
            <rect x="240" y="215" width="240" height="230" rx="10" fill="#1c1210" stroke="#ff7a18" strokeWidth="2" />
            <rect x="252" y="227" width="216" height="206" rx="6" fill="rgba(255,122,24,0.12)" />
            {/* the workshop */}
            <path d="M595 500 V455 L630 428 L665 455 V500 Z" fill="#1d1a20" stroke="#ff9d42" strokeOpacity="0.7" />
            <rect x="620" y="468" width="20" height="16" fill="#ffc078" opacity="0.85" />
            {/* the tower */}
            <path d="M800 270 L806 70 L820 30 L834 70 L840 270 Z" fill="#141018" stroke="#ff7a18" strokeWidth="2" />
            <path d="M820 40 V270 M810 80 V270 M830 80 V270" stroke="rgba(255,157,66,0.6)" strokeWidth="1.2" />
            {/* the square */}
            <circle cx="820" cy="500" r="46" fill="#1a1416" stroke="#ff9d42" strokeOpacity="0.6" />
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <circle key={k} cx={820 + 34 * Math.cos((k * Math.PI) / 3)} cy={500 + 34 * Math.sin((k * Math.PI) / 3)} r="2.5" fill="#ffc078" />
            ))}
          </g>

          {/* the guide's route */}
          <polyline points={route} fill="none" stroke="rgba(255,157,66,0.25)" strokeWidth="3" strokeLinejoin="round" />
          <polyline points={route} fill="none" stroke="#ffb066" strokeWidth="3" strokeLinejoin="round" strokeDasharray="10 16" className="carte-route" />
        </svg>

        {/* The places as real buttons (keyboard, screen readers), over the drawing. */}
        {lieuxCarte.map((l) => {
          const estIci = ici === l.id;
          const enAvant = actif === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => aller(l.id)}
              onMouseEnter={() => setSurvol(l.id)}
              onMouseLeave={() => setSurvol(null)}
              onFocus={() => setSurvol(l.id)}
              onBlur={() => setSurvol(null)}
              aria-current={estIci ? "location" : undefined}
              aria-label={`${noms[l.id]} : ${t.descriptions[l.id]}${estIci ? ` (${t.ici})` : ""}`}
              className="carte-lieu group absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
              style={{ left: `${(l.x / L) * 100}%`, top: `${(l.y / H) * 100}%` }}
              data-taille={l.taille}
              data-avant={enAvant ? "" : undefined}
            >
              <span className="carte-point" aria-hidden />
              {estIci && <span className="carte-ici" aria-hidden />}
              <span className="carte-nom">{noms[l.id]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-4 px-6 pt-3 pb-6 sm:flex-row sm:justify-between sm:px-8">
      {/* What the highlighted place holds (hover / focus), or where you are. */}
      <p aria-live="polite" className="text-center text-sm text-bone-300 sm:text-left">
        {actif ? (
          <>
            <span className="font-medium text-ember-300">{noms[actif]}</span> · {t.descriptions[actif]}
            {actif === ici && <span className="ml-2 text-bone-500">({t.ici})</span>}
          </>
        ) : (
          t.sousTitre
        )}
      </p>
      <Link
        href={`/${locale}#contact`}
        onClick={() => ref.current?.close()}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-linear-to-r from-ember-500 to-ember-600 px-5 text-sm font-medium text-ink-950 shadow-[0_10px_30px_-14px_rgba(255,122,24,0.9)] transition-all hover:from-ember-400 hover:to-ember-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400"
      >
        {t.cta}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
      </div>
    </dialog>
  );
}
