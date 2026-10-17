"use client";

import { useState, type FormEvent } from "react";
import { Gauge, Loader2 } from "lucide-react";

import type { Locale } from "@/lib/i18n";

type Resultat = { url: string; scores: Record<string, number>; lcp: string | null; pistes: { titre: string; gainMs: number }[] };

const TEXTES = {
  fr: {
    label: "L'adresse de votre site",
    bouton: "Lancer le diagnostic",
    attente: "Analyse en cours (30 à 50 secondes)…",
    noms: { performance: "Vitesse", seo: "Référencement", accessibility: "Accessibilité", "best-practices": "Bonnes pratiques" },
    pistes: "Ce qu'on corrigerait d'abord",
    lcp: "Affichage du contenu principal",
    erreurs: {
      invalid_url: "Entrez une adresse de site, par exemple votre-site.com",
      rate_limited: "Trop de diagnostics d'un coup : réessayez dans quelques minutes.",
      quota: "Le diagnostic est très demandé : réessayez dans un instant.",
      unreachable: "Ce site ne répond pas à l'analyse. Vérifiez l'adresse.",
      autre: "Le diagnostic n'a pas abouti. Réessayez.",
    },
    source: "Mesuré en direct par Google PageSpeed (mobile).",
  },
  en: {
    label: "Your website address",
    bouton: "Run the check-up",
    attente: "Analysing (30 to 50 seconds)…",
    noms: { performance: "Speed", seo: "SEO", accessibility: "Accessibility", "best-practices": "Best practices" },
    pistes: "What we would fix first",
    lcp: "Main content shows up in",
    erreurs: {
      invalid_url: "Enter a website address, for example your-site.com",
      rate_limited: "Too many check-ups at once: try again in a few minutes.",
      quota: "The check-up is in high demand: try again in a moment.",
      unreachable: "This website doesn't respond to the analysis. Check the address.",
      autre: "The check-up didn't finish. Try again.",
    },
    source: "Measured live by Google PageSpeed (mobile).",
  },
};

/** A score as a glowing arc: green from 90, ember from 50, red below. */
function Jauge({ valeur, nom }: { valeur: number; nom: string }) {
  const couleur = valeur >= 90 ? "#4ade80" : valeur >= 50 ? "#ff9d42" : "#f87171";
  const c = 2 * Math.PI * 26;
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <svg viewBox="0 0 64 64" className="size-16" role="img" aria-label={`${nom} : ${valeur} / 100`}>
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r="26" fill="none" stroke={couleur} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - valeur / 100)} transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 6px ${couleur})` }}
        />
        <text x="32" y="37" textAnchor="middle" className="fill-bone-50 font-display text-[15px] font-semibold">{valeur}</text>
      </svg>
      <span className="text-[0.7rem] text-bone-300">{nom}</span>
    </div>
  );
}

/** The live check-up on the guide's tablet (POST /api/diagnostic → Google PageSpeed Insights). */
export function Diagnostic({ locale }: { locale: Locale }) {
  const t = TEXTES[locale];
  const [adresse, setAdresse] = useState("");
  const [etat, setEtat] = useState<"repos" | "analyse" | "fait" | "erreur">("repos");
  const [erreur, setErreur] = useState("");
  const [res, setRes] = useState<Resultat | null>(null);

  const lancer = async (e: FormEvent) => {
    e.preventDefault();
    setEtat("analyse");
    setErreur("");
    try {
      const rep = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: adresse, locale }),
      });
      const data = await rep.json();
      if (!rep.ok) {
        setErreur(t.erreurs[data.error as keyof typeof t.erreurs] ?? t.erreurs.autre);
        setEtat("erreur");
        return;
      }
      setRes(data);
      setEtat("fait");
    } catch {
      setErreur(t.erreurs.autre);
      setEtat("erreur");
    }
  };

  return (
    <div className="mt-4 md:mt-0">
      <form onSubmit={lancer} className="flex flex-col gap-2 sm:flex-row" noValidate>
        <label htmlFor="diag-url" className="sr-only">{t.label}</label>
        <input
          id="diag-url"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="votre-site.com"
          inputMode="url"
          autoComplete="url"
          className="min-h-11 flex-1 rounded-full border border-white/15 bg-ink-900/70 px-4 text-sm text-bone-50 placeholder:text-bone-500 focus:border-ember-400/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={etat === "analyse" || !adresse.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-linear-to-r from-ember-500 to-ember-600 px-5 text-sm font-medium text-ink-950 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-400"
        >
          {etat === "analyse" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Gauge className="size-4" aria-hidden />}
          {t.bouton}
        </button>
      </form>

      <div aria-live="polite" className="mt-3 md:mt-5">
        {etat === "analyse" && <p className="text-sm text-bone-300">{t.attente}</p>}
        {etat === "erreur" && <p role="alert" className="text-sm text-ember-200">{erreur}</p>}
        {etat === "fait" && res && (
          <div className="labs-apparition">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(res.scores).map(([k, v]) => (
                <Jauge key={k} valeur={v} nom={t.noms[k as keyof typeof t.noms] ?? k} />
              ))}
            </div>
            {res.lcp && <p className="mt-4 text-sm text-bone-300">{t.lcp} : <span className="text-bone-50">{res.lcp}</span></p>}
            {res.pistes.length > 0 && (
              <>
                <p className="mt-4 text-xs tracking-[0.18em] text-ember-300 uppercase">{t.pistes}</p>
                <ul className="mt-2 space-y-1.5 text-sm text-bone-100">
                  {res.pistes.map((p) => (
                    <li key={p.titre}>· {p.titre}{p.gainMs ? ` (−${(p.gainMs / 1000).toFixed(1)} s)` : ""}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-4 text-[0.7rem] text-bone-500">{t.source}</p>
          </div>
        )}
      </div>
    </div>
  );
}
