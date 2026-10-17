"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Construction, FileText } from "lucide-react";

import { ButtonLink, Eyebrow } from "@/components/ui";
import type { Locale } from "@/lib/i18n";
import { couches, labs, projets, zones, type CoucheId, type ProjetId } from "@/lib/labs";
import { BadgeStatut } from "./badge-statut";
import { DemoHephetion } from "./demo-hephetion";
import { DemoRuby } from "./demo-ruby";
import { DemoStudio } from "./demo-studio";
import { FicheProjet } from "./fiche-projet";
import { Tour } from "./tour";

const DEMOS = { hephetion: DemoHephetion, ruby: DemoRuby, studio: DemoStudio };

/** Narrow screens get the floor content in the page flow, wide ones on the wall screens. */
function useMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 47.99rem)");
    const maj = () => setMobile(m.matches);
    maj();
    m.addEventListener("change", maj);
    return () => m.removeEventListener("change", maj);
  }, []);
  return mobile;
}

/**
 * Hephera Labs: one camera through one tower. The page itself is only scroll
 * length (one spacer per zone of lib/labs.ts); everything visible happens in
 * the stage (Tour): the climb, the landings, the wall screens that light up.
 */
export function Labs({ locale }: { locale: Locale }) {
  const t = labs[locale];
  const sectionRef = useRef<HTMLElement>(null);
  const mobile = useMobile();
  const [zone, setZone] = useState(0);
  const [fiche, setFiche] = useState<ProjetId | null>(null);

  const premiereZone = (c: CoucheId) => zones.findIndex((z) => z.couche === c && z.mode === "tenue");

  const allerA = useCallback((c: CoucheId, instant = false) => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .querySelector(`[data-zone="${premiereZone(c)}"]`)
      ?.scrollIntoView({ behavior: instant || reduit ? "auto" : "smooth", block: "start" });
  }, []);

  // Deep links: ?couche=templates goes to that floor, ?projet=ruby also opens its sheet.
  // Wait for layout (two frames) and keep the browser from restoring an older scroll on top.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const projet = params.get("projet") as ProjetId | null;
    const couche = (params.get("couche") as CoucheId | null) ?? projets.find((p) => p.id === projet)?.couche;
    if (!couche && !projet) return;
    window.history.scrollRestoration = "manual";
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        if (couche && couches.includes(couche)) allerA(couche, true);
        if (projet && projets.some((p) => p.id === projet)) setFiche(projet);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [allerA]);

  const ouvrirFiche = useCallback((id: ProjetId | null) => {
    setFiche(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("projet", id);
    else url.searchParams.delete("projet");
    window.history.replaceState(null, "", url);
  }, []);

  const contenu = useCallback(
    (n: number) => <ContenuEcran locale={locale} zone={n} actif={n === zone} onFiche={ouvrirFiche} />,
    [locale, ouvrirFiche, zone],
  );

  const titre = (
    <>
      <Eyebrow>{t.eyebrow}</Eyebrow>
      <h1 className="mx-auto mt-5 max-w-4xl font-display text-4xl leading-[1.06] font-semibold text-balance text-bone-50 [text-shadow:0_2px_30px_rgba(0,0,0,0.75)] sm:text-6xl">
        {t.titre} <span className="labs-braise-texte">{t.titreAccent}</span>
      </h1>
      <p className="labs-defiler mt-8 flex flex-col items-center gap-3 text-sm tracking-wide text-bone-300 [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]">
        {t.defiler}
        <span aria-hidden className="labs-defiler-trait block h-10 w-px bg-linear-to-b from-ember-400 to-transparent" />
      </p>
    </>
  );

  return (
    <>
      <section ref={sectionRef} className="relative" aria-label={t.eyebrow}>
        <Tour
          sectionRef={sectionRef}
          titre={titre}
          noms={Object.fromEntries(couches.map((c) => [c, t.couches[c].nom])) as Record<CoucheId, string>}
          libelleEtage={t.etage}
          afficheur={t.afficheur}
          mobile={mobile}
          ecran={contenu}
          onZone={setZone}
          onAller={allerA}
        />

        {zones.map((z, n) => (
          <div
            key={n}
            data-zone={n}
            id={z.mode === "tenue" && premiereZone(z.couche!) === n ? `couche-${z.couche}` : undefined}
            className="pointer-events-none relative"
            style={{ height: `${z.hauteur}svh` }}
          />
        ))}
      </section>

      <FicheProjet locale={locale} id={fiche} onFermer={() => ouvrirFiche(null)} />
    </>
  );
}

/** What a wall screen shows: laid out for a 1120×620 screen, stacked on a phone. */
function ContenuEcran({ locale, zone, actif, onFiche }: { locale: Locale; zone: number; actif: boolean; onFiche: (id: ProjetId) => void }) {
  const t = labs[locale];
  const z = zones[zone];
  if (!z?.couche) return null;
  const c = z.couche;
  const etage = couches.indexOf(c);
  const projetsIci = projets.filter((p) => p.couche === c);
  const projet = z.page !== undefined ? projetsIci[z.page] : undefined;

  const entete = (
    <p className="flex items-center gap-3 text-[0.7rem] font-medium tracking-[0.24em] text-ember-300 uppercase">
      <span className="font-display text-bone-50 tabular-nums">{String(etage).padStart(2, "0")}</span>
      <span className="h-px w-8 bg-ember-500/60" />
      {t.couches[c].nom}
    </p>
  );

  if (projet) {
    const p = t.projets[projet.id];
    const Demo = DEMOS[projet.id];
    return (
      <div className="grid min-h-full content-center gap-6 px-6 py-7 md:grid-cols-[0.85fr_1.15fr] md:items-center md:gap-8 md:p-10">
        <div>
          {entete}
          <p className="mt-6 text-xs tracking-wide text-bone-300">{p.categorie}</p>
          <h2 className="mt-1 font-display text-4xl font-semibold text-bone-50">{p.nom}</h2>
          <div className="mt-4">
            <BadgeStatut statut={projet.statut} libelle={t.statuts[projet.statut].nom} titre={t.statuts[projet.statut].detail} />
          </div>
          <p className="mt-5 text-lg leading-relaxed text-bone-100">{p.accroche}</p>
          <button
            type="button"
            onClick={() => onFiche(projet.id)}
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-ember-400/30 px-5 text-sm font-medium text-bone-50 transition-colors hover:border-ember-300 hover:bg-ember-500/10 focus-visible:outline-2 focus-visible:outline-ember-400"
          >
            <FileText className="size-4" aria-hidden />
            {t.voirFiche}
          </button>
        </div>
        <Demo locale={locale} compact actif={actif} />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-7 md:px-16 md:py-0">
      {entete}
      <h2 className="mt-6 max-w-3xl font-display text-4xl leading-[1.1] font-semibold text-balance text-bone-50 md:text-5xl">
        {c === "toit" ? t.ctaTitre : t.couches[c].titre}
      </h2>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-bone-100">{c === "hall" ? t.intro : c === "toit" ? t.ctaTexte : t.couches[c].texte}</p>

      {c === "hall" && (
        <ul className="mt-8 flex flex-wrap gap-2.5" aria-label="Statuts">
          {(Object.keys(t.statuts) as (keyof typeof t.statuts)[]).map((s) => (
            <li key={s}>
              <BadgeStatut statut={s} libelle={t.statuts[s].nom} titre={t.statuts[s].detail} />
            </li>
          ))}
        </ul>
      )}
      {c === "labo" && (
        <ul className="mt-8 grid max-w-2xl gap-3">
          {t.chantier.map((ligne) => (
            <li key={ligne} className="flex items-center gap-3 text-bone-100">
              <Construction className="size-4 shrink-0 text-ember-300" aria-hidden />
              {ligne}
            </li>
          ))}
        </ul>
      )}
      {c === "toit" && (
        <div className="mt-9">
          <ButtonLink href={`/${locale}/contact`} withArrow>
            {t.cta}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
