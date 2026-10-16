"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";

import type { Locale } from "@/lib/i18n";
import { labs } from "@/lib/labs";

const FORMATS = { "9:16": 9 / 16, "1:1": 1, "16:9": 16 / 9 } as const;
type Format = keyof typeof FORMATS;

/** "https://www.my-shop.co.uk/fr" → "My Shop" (the brand the ad will carry). */
function marqueDe(adresse: string): string | null {
  const nettoye = adresse.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "");
  const hote = nettoye.split(/[/?#]/)[0];
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(hote)) return null;
  const nom = hote.split(".")[0].replace(/-/g, " ");
  return nom.replace(/\b\p{L}/gu, (l) => l.toUpperCase());
}

/**
 * A staged demo of Hephetion: the visitor's address goes through the four real
 * stages, then a short motion ad plays with their brand. Nothing leaves the
 * browser; the real pipeline (Claude + Remotion) is not called.
 */
export function DemoHephetion({ locale, compact = false, actif = false }: { locale: Locale; compact?: boolean; actif?: boolean }) {
  const t = labs[locale];
  const d = t.hephetion;
  const [adresse, setAdresse] = useState("hephera.com");
  const [erreur, setErreur] = useState(false);
  const [etape, setEtape] = useState(-1);          // -1 idle, 0..3 stages, 4 done
  const [marque, setMarque] = useState("Hephera");
  const [format, setFormat] = useState<Format>("9:16");
  const [prise, setPrise] = useState(0);           // restarts the ad's animation
  const minuteur = useRef(0);

  useEffect(() => () => window.clearTimeout(minuteur.current), []);

  const generer = (e: FormEvent) => {
    e.preventDefault();
    lancer(adresse);
  };

  const lancer = (adresse: string) => {
    const m = marqueDe(adresse);
    if (!m) {
      setErreur(true);
      return;
    }
    setErreur(false);
    setMarque(m);
    window.clearTimeout(minuteur.current);
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pas = reduit ? 120 : 650;
    const avancer = (n: number) => {
      setEtape(n);
      if (n < 4) minuteur.current = window.setTimeout(() => avancer(n + 1), pas);
      else setPrise((p) => p + 1);
    };
    avancer(0);
  };

  // The first time its screen lights up, the demo runs on its own: the floor is alive on arrival.
  const dejaJoue = useRef(false);
  useEffect(() => {
    if (!actif || dejaJoue.current) return;
    dejaJoue.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => lancer(adresse), 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif]);

  const enCours = etape >= 0 && etape < 4;
  const domaine = adresse.trim().replace(/^[a-z]+:\/\//i, "").replace(/^www\./i, "").split("/")[0];

  return (
    <div className={compact ? "" : "rounded-2xl border border-white/8 bg-ink-950/55 p-4"}>
      <p className="flex items-center gap-2 text-[0.7rem] font-medium tracking-[0.18em] text-ember-300 uppercase">
        <Sparkles className="size-3.5" aria-hidden /> {t.demo} · {t.essayer}
      </p>
      <form onSubmit={generer} className="mt-3 flex flex-col gap-2 sm:flex-row" noValidate>
        <label className="sr-only" htmlFor="hephetion-url">{d.label}</label>
        <input
          id="hephetion-url"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder={d.placeholder}
          inputMode="url"
          autoComplete="url"
          aria-invalid={erreur}
          aria-describedby={erreur ? "hephetion-erreur" : undefined}
          className="min-h-11 flex-1 rounded-full border border-white/12 bg-ink-900/80 px-4 text-sm text-bone-50 placeholder:text-bone-500 focus:border-ember-400/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={enCours}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-linear-to-r from-ember-500 to-ember-600 px-5 text-sm font-medium text-ink-950 transition-all hover:from-ember-400 hover:to-ember-500 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400"
        >
          {enCours ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {d.generer}
        </button>
      </form>
      {erreur && (
        <p id="hephetion-erreur" role="alert" className="mt-2 text-xs text-ember-200">{d.erreurUrl}</p>
      )}

      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
        {d.etapes.map((nom, n) => {
          const fait = etape > n;
          const ici = etape === n;
          return (
            <li
              key={nom}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition-colors duration-300 ${
                fait ? "border-ember-400/40 bg-ember-500/10 text-bone-50" : ici ? "border-ember-300/60 text-bone-50" : "border-white/8 text-bone-500"
              }`}
            >
              {fait ? <Check className="size-3.5 text-ember-300" aria-hidden /> : ici ? <Loader2 className="size-3.5 animate-spin text-ember-300" aria-hidden /> : <span className="size-3.5 rounded-full border border-current" aria-hidden />}
              {nom}
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label={d.formats} className="flex gap-1 rounded-full border border-white/10 bg-ink-900/70 p-1">
          {(Object.keys(FORMATS) as Format[]).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={format === f}
              onClick={() => setFormat(f)}
              className="relative min-h-9 rounded-full px-3 text-xs font-medium text-bone-300 transition-colors aria-checked:text-ink-950 focus-visible:outline-2 focus-visible:outline-ember-400"
            >
              {format === f && (
                <motion.span layoutId="hephetion-format" className="absolute inset-0 rounded-full bg-ember-400" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
              )}
              <span className="relative">{f}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-4 grid place-items-center ${compact ? "h-52" : "h-64 sm:h-72"}`}>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="relative h-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-[0_20px_60px_-20px_rgba(255,122,24,0.45)]"
          style={{ aspectRatio: FORMATS[format], containerType: "inline-size" }}
        >
          <Pub key={prise} marque={marque} domaine={domaine || "hephera.com"} accroches={d.accroches} pret={etape === 4} />
        </motion.div>
      </div>
    </div>
  );
}

/** The ad itself: four beats, looping, typeset to the frame it's given. */
function Pub({ marque, domaine, accroches, pret }: { marque: string; domaine: string; accroches: string[]; pret: boolean }) {
  const [temps, setTemps] = useState(0);
  useEffect(() => {
    if (!pret) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTemps((n) => n + 1), 1800);
    return () => window.clearInterval(id);
  }, [pret]);

  const temps4 = temps % 4;
  const texte = temps4 === 0 ? marque : temps4 === 3 ? domaine : accroches[temps4 - 1];

  return (
    <div className="absolute inset-0 grid place-items-center p-[8%]">
      <div aria-hidden className="labs-pub-fond absolute inset-0" />
      <div aria-hidden className="labs-pub-anneau absolute top-1/2 left-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <AnimatePresence mode="wait">
        <motion.p
          key={pret ? temps : "attente"}
          initial={{ opacity: 0, y: 18, scale: 0.96, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`relative text-center font-display leading-tight font-semibold text-balance ${
            temps4 === 0 || !pret ? "text-[clamp(1.4rem,9cqi,3rem)] text-bone-50" : "text-[clamp(1rem,7cqi,2.2rem)] text-bone-50"
          }`}
        >
          {pret ? texte : marque}
          {pret && temps4 === 3 && <span className="mt-3 block text-sm font-medium text-ember-300">→</span>}
        </motion.p>
      </AnimatePresence>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 font-display text-[0.6rem] tracking-[0.3em] text-bone-300/70 uppercase">
        {marque}
      </span>
    </div>
  );
}
