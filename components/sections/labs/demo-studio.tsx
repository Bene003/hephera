"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowUpRight, Monitor, Smartphone, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import type { Locale } from "@/lib/i18n";
import { labs } from "@/lib/labs";

const NUANCIER = ["#ff7a18", "#10b981", "#3b82f6", "#8b5cf6", "#f43f5e", "#eab308"];

/** #ff7a18 → [h, s, l] (0-360, 0-100, 0-100). */
function versHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

/**
 * The same idea as nouveau-site.mjs in hephera-gabarits: one colour in, a
 * whole 300→700 palette out, so every shade of the template follows the brand.
 */
function palette(hex: string) {
  const [h, s, l] = versHsl(hex);
  const nuance = (dl: number, ds = 0) =>
    `hsl(${h.toFixed(0)} ${Math.min(100, Math.max(0, s + ds)).toFixed(0)}% ${Math.min(96, Math.max(6, l + dl)).toFixed(0)}%)`;
  return {
    "--g-300": nuance(22, -6),
    "--g-400": nuance(11, -2),
    "--g-500": nuance(0),
    "--g-600": nuance(-8, 2),
    "--g-700": nuance(-18, 4),
  } as CSSProperties;
}

/** A live, recolourable miniature of the Studio template. */
export function DemoStudio({ locale, compact = false, actif = false }: { locale: Locale; compact?: boolean; actif?: boolean }) {
  const t = labs[locale];
  const d = t.studio;
  const [couleur, setCouleur] = useState(NUANCIER[0]);
  const [nom, setNom] = useState(d.nomDefaut);
  const [appareil, setAppareil] = useState<"bureau" | "mobile">("bureau");
  const vars = useMemo(() => palette(couleur), [couleur]);
  // While its screen is on and nobody has touched it, the template shows off: one colour after another.
  const [touche, setTouche] = useState(false);
  useEffect(() => {
    if (!actif || touche || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setCouleur((c) => NUANCIER[(NUANCIER.indexOf(c) + 1) % NUANCIER.length]), 1800);
    return () => window.clearInterval(id);
  }, [actif, touche]);
  const marque = nom.trim() || d.nomDefaut;

  return (
    <div className={compact ? "" : "rounded-2xl border border-white/8 bg-ink-950/55 p-4"} onPointerDown={() => setTouche(true)} onKeyDown={() => setTouche(true)}>
      <p className="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.18em] text-ember-300 uppercase">
        <Sparkles className="size-3.5" aria-hidden /> {t.demo} · {t.essayer}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <fieldset>
          <legend className="text-xs text-bone-300">{d.couleur}</legend>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {NUANCIER.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCouleur(c)}
                aria-label={c}
                aria-pressed={couleur === c}
                className="size-8 rounded-full border-2 border-transparent transition-transform hover:scale-110 aria-pressed:border-bone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400"
                style={{ background: c }}
              />
            ))}
            <label className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/20 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]">
              <span className="sr-only">{d.couleur}</span>
              <input type="color" value={couleur} onChange={(e) => setCouleur(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </div>
        </fieldset>
        <div>
          <label htmlFor="studio-nom" className="text-xs text-bone-300">{d.nom}</label>
          <input
            id="studio-nom"
            value={nom}
            maxLength={24}
            onChange={(e) => setNom(e.target.value)}
            className="mt-2 min-h-11 w-full rounded-full border border-white/12 bg-ink-900/80 px-4 text-sm text-bone-50 focus:border-ember-400/60 focus:outline-none"
          />
        </div>
      </div>

      <div role="radiogroup" aria-label={`${d.bureau} / ${d.mobile}`} className="mt-3 inline-flex gap-1 rounded-full border border-white/10 bg-ink-900/70 p-1">
        {(["bureau", "mobile"] as const).map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={appareil === a}
            onClick={() => setAppareil(a)}
            className="relative inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-bone-300 aria-checked:text-ink-950 focus-visible:outline-2 focus-visible:outline-ember-400"
          >
            {appareil === a && <motion.span layoutId="studio-appareil" className="absolute inset-0 rounded-full bg-bone-50" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative inline-flex items-center gap-1.5">
              {a === "bureau" ? <Monitor className="size-3.5" aria-hidden /> : <Smartphone className="size-3.5" aria-hidden />}
              {a === "bureau" ? d.bureau : d.mobile}
            </span>
          </button>
        ))}
      </div>

      <div className={`mt-4 flex items-center justify-center ${compact ? "h-52" : "h-64 sm:h-72"}`}>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="relative h-full max-w-full overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b10] shadow-2xl"
          style={{ ...vars, aspectRatio: appareil === "bureau" ? 16 / 10 : 9 / 18, containerType: "inline-size" }}
        >
          <MiniSite marque={marque} d={d} mobile={appareil === "mobile"} locale={locale} />
        </motion.div>
      </div>

      <a
        href="https://gabarit-studio.vercel.app"
        target="_blank"
        rel="noopener"
        className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ember-300 hover:text-ember-200"
      >
        {d.voirDemo} <ArrowUpRight className="size-4" aria-hidden />
      </a>
    </div>
  );
}

function MiniSite({ marque, d, mobile, locale }: { marque: string; d: (typeof labs)[Locale]["studio"]; mobile: boolean; locale: Locale }) {
  const liens = locale === "fr" ? ["Services", "Méthode", "Contact"] : ["Services", "Method", "Contact"];
  const services = locale === "fr" ? ["Web", "SEO", "Automatisation"] : ["Web", "SEO", "Automation"];
  const transition = "background-color .5s, color .5s, border-color .5s, box-shadow .5s";
  return (
    <div className="absolute inset-0 flex flex-col text-[#f7f4ef]" style={{ fontSize: mobile ? "4.2cqi" : "2.2cqi" }}>
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 75% 20%, color-mix(in oklab, var(--g-500) 35%, transparent), transparent 70%)", transition }} />
      <div className="relative flex items-center justify-between px-[5%] py-[3.5%]">
        <span className="flex items-center gap-[0.5em] font-display font-semibold">
          <span className="grid size-[1.8em] place-items-center rounded-[0.5em] text-[0.8em] text-[#07070a]" style={{ background: "var(--g-500)", transition }}>
            {marque.charAt(0).toUpperCase()}
          </span>
          {marque}
        </span>
        {!mobile && (
          <span className="flex gap-[1.4em] text-[0.75em] text-[#b9b2a6]">
            {liens.map((l) => <span key={l}>{l}</span>)}
          </span>
        )}
      </div>
      <div className="relative flex flex-1 flex-col justify-center px-[5%]">
        <span className="text-[0.62em] tracking-[0.25em] uppercase" style={{ color: "var(--g-300)", transition }}>{marque}</span>
        <p className="mt-[0.4em] max-w-[16em] font-display text-[1.75em] leading-[1.12] font-semibold">{d.apercuTitre}</p>
        <p className="mt-[0.7em] max-w-[24em] text-[0.8em] text-[#b9b2a6]">{d.apercuTexte}</p>
        <span
          className="mt-[1.1em] inline-flex w-fit rounded-full px-[1.2em] py-[0.55em] text-[0.75em] font-medium text-[#07070a]"
          style={{ background: "linear-gradient(90deg, var(--g-500), var(--g-600))", boxShadow: "0 0.6em 1.6em -0.6em var(--g-500)", transition }}
        >
          {d.apercuBouton}
        </span>
      </div>
      <div className={`relative grid gap-[0.6em] px-[5%] pb-[4%] ${mobile ? "grid-cols-1" : "grid-cols-3"}`}>
        {services.slice(0, mobile ? 2 : 3).map((s) => (
          <div key={s} className="rounded-[0.6em] border bg-white/[0.03] px-[0.8em] py-[0.6em] text-[0.7em]" style={{ borderColor: "color-mix(in oklab, var(--g-500) 35%, transparent)", transition }}>
            <span className="mb-[0.4em] block h-[0.25em] w-[2em] rounded-full" style={{ background: "var(--g-400)", transition }} />
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
