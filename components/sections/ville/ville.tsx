"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { ButtonLink, Eyebrow } from "@/components/ui";
import { SceneVoyage, type ConfigVoyage } from "@/components/voyage/scene";
import { aProposSlug } from "@/lib/a-propos-slug";
import type { Dictionary } from "@/lib/content";
import type { Locale } from "@/lib/i18n";
import { serviceHref, type ServiceKey } from "@/lib/services";
import { fichiersVille, lieuxVille, ordreVille, paliersVille, villeTextes, zonesVille, type LieuVille } from "@/lib/ville";
import { Diagnostic } from "./diagnostic";

const CONFIG: ConfigVoyage = {
  ...fichiersVille,
  zones: zonesVille,
  ordre: ordreVille,
  paliers: paliersVille,
  transits: ordreVille.filter((s) => s !== "R0"),
  lieux: lieuxVille,
  zoomMax: 1.3,           // the Forge's screens sit further away than the tower's
  largeurEcran: 700,      // laid out narrower than the tower's (970): bigger text on the city's screens
};

const SERVICES: ServiceKey[] = ["web", "seo", "automation", "consulting"];

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
 * The homepage: a walk through the Hephera city behind the monitor-headed guide of the hero.
 * The page is only scroll length; everything visible happens in the journey engine
 * (components/voyage/scene.tsx), the same one as the Labs tower.
 */
export function Ville({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = villeTextes[locale];
  const sectionRef = useRef<HTMLElement>(null);
  const mobile = useMobile();
  const [zone, setZone] = useState(0);

  const premiereTenue = (l: LieuVille) => zonesVille.findIndex((z) => z.lieu === l && z.mode === "tenue");
  const allerA = useCallback((l: string) => {
    const n = l === "arrivee" ? 0 : premiereTenue(l as LieuVille);
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelector(`[data-zone="${n}"]`)?.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "start" });
  }, []);

  // #services, #methode, #contact (header links) land on their place of the city.
  useEffect(() => {
    const ancres: Record<string, LieuVille> = { "#services": "forge", "#methode": "atelier", "#contact": "place", "#chiffres": "forge" };
    const aller = () => {
      const l = ancres[window.location.hash];
      if (l) requestAnimationFrame(() => requestAnimationFrame(() => allerA(l)));
    };
    aller();
    window.addEventListener("hashchange", aller);
    return () => window.removeEventListener("hashchange", aller);
  }, [allerA]);

  // Tell the city map (components/carte.tsx) where the guide is. Stable: the engine depends on it.
  const surZone = useCallback((n: number) => {
    setZone(n);
    window.dispatchEvent(new CustomEvent("ville:lieu", { detail: zonesVille[n]?.lieu }));
  }, []);

  const contenu = useCallback(
    (n: number) => <EcranVille locale={locale} dict={dict} zone={n} actif={n === zone} />,
    [locale, dict, zone],
  );

  const h = dict.hero;
  const titre = (
    // On the left, as in the hero: the guide stands on the right of the first frame.
    // Phones: the guide's head fills the middle of the vertical frame, the words sit on his jacket below.
    <div className="relative mx-auto max-w-6xl translate-y-[44svh] text-left sm:px-8 md:translate-y-0">
      {/* A soft shadow behind the words on the light studio wall, never a box. */}
      <span aria-hidden className="absolute -inset-y-24 -left-40 w-[46rem] max-w-[120vw] bg-[radial-gradient(closest-side,rgba(7,7,10,0.5),transparent)]" />
      <div className="relative max-w-xl">
      <Eyebrow>{h.eyebrow}</Eyebrow>
      <h1 className="mt-4 font-display text-3xl leading-[1.06] font-semibold text-balance text-bone-50 [text-shadow:0_2px_30px_rgba(0,0,0,0.75)] sm:text-6xl">
        {h.titleStart} <span className="labs-braise-texte">{h.titleAccent}</span> {h.titleEnd}
      </h1>
      <p className="labs-defiler mt-8 flex flex-col items-start gap-3 text-sm tracking-wide text-bone-300 [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]">
        {t.suivre}
        <span aria-hidden className="labs-defiler-trait ml-1 block h-10 w-px bg-linear-to-b from-ember-400 to-transparent" />
      </p>
    </div></div>
  );

  return (
    <section ref={sectionRef} className="relative" aria-label={h.eyebrow}>
      <SceneVoyage
        config={CONFIG}
        sectionRef={sectionRef}
        titre={titre}
        noms={t.lieux}
        libelleEtage={t.etape}
        afficheur={t.carte}
        mobile={mobile}
        ecran={contenu}
        onZone={surZone}
        onAller={allerA}
        iconeTransit={<MapPin className="size-4 text-ember-400" aria-hidden />}
        boutons="points"
      />
      {zonesVille.map((z, n) => (
        <div
          key={n}
          data-zone={n}
          id={z.mode === "tenue" && premiereTenue(z.lieu as LieuVille) === n ? `ville-${z.lieu}` : undefined}
          className="pointer-events-none relative"
          style={{ height: `${z.hauteur}svh` }}
        />
      ))}
    </section>
  );
}

/** What each screen of the city shows. Copy comes from the site's dictionary. */
function EcranVille({ locale, dict, zone, actif }: { locale: Locale; dict: Dictionary; zone: number; actif: boolean }) {
  const t = villeTextes[locale];
  const z = zonesVille[zone];
  const lieu = z?.lieu as LieuVille | undefined;
  if (!lieu) return null;

  const entete = (
    <p className="flex items-center gap-3 text-[0.7rem] font-medium tracking-[0.24em] text-ember-300 uppercase">
      <MapPin className="size-3.5" aria-hidden />
      {t.lieux[lieu]}
    </p>
  );
  const cadre = "flex min-h-full flex-col justify-center px-5 py-5 md:px-14 md:py-0";

  if (lieu === "forge") {
    return (
      // The guide stands in front of this screen's lower left: the text keeps to the right.
      <div className={`${cadre} md:items-end md:text-right`}>
        {entete}
        <h2 className="mt-3 md:mt-5 max-w-xl font-display text-4xl leading-[1.1] font-semibold text-balance text-bone-50 md:text-5xl">{t.forgeTitre}</h2>
        <p className="mt-2 md:mt-4 max-w-lg text-lg leading-relaxed text-bone-100">{t.forgeTexte}</p>
        <p className="mt-4 md:mt-7 max-w-lg font-display text-xl text-bone-50">
          {dict.manifesto.lineOne} <span className="labs-braise-texte">{dict.manifesto.lineTwo}</span>
        </p>
      </div>
    );
  }

  if (SERVICES.includes(lieu as ServiceKey)) {
    const s = dict.serviceContent[lieu as ServiceKey];
    return (
      <div className={cadre}>
        <div>
          {entete}
          <h2 className="mt-3 md:mt-5 font-display text-4xl font-semibold text-bone-50">{s.name}</h2>
          <p className="mt-2 text-lg text-ember-200">{s.tagline}</p>
          <p className="mt-2 md:mt-4 max-w-lg leading-relaxed text-bone-100">{s.short}</p>
          <Link
            href={serviceHref(locale, lieu as ServiceKey)}
            className="mt-4 md:mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-ember-400/40 px-5 text-sm font-medium text-bone-50 transition-colors hover:bg-ember-500/10 focus-visible:outline-2 focus-visible:outline-ember-400"
          >
            {t.voirService} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-x-6 md:mt-6">
          {s.bullets.map((b, i) => (
            <li key={b} className="labs-apparition flex items-center gap-3 text-bone-100" style={{ animationDelay: actif ? `${150 + i * 110}ms` : undefined }}>
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-ember-400 shadow-[0_0_10px_rgba(255,157,66,0.9)]" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (lieu === "atelier") {
    const m = dict.method;
    return (
      <div className={cadre}>
        {entete}
        <h2 className="mt-3 md:mt-5 font-display text-4xl font-semibold text-bone-50">{t.atelierTitre}</h2>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-bone-100">{t.atelierTexte}</p>
        <p className="mt-4 md:mt-7 text-xs tracking-[0.2em] text-ember-300 uppercase">{t.methodeTitre}</p>
        <ol className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 md:mt-4">
          {m.steps.map((s) => (
            <li key={s.n} className="flex items-baseline gap-2.5">
              <span className="font-display text-sm text-ember-300 tabular-nums">{s.n}</span>
              <span className="font-display text-lg font-semibold text-bone-50">{s.title}</span>
            </li>
          ))}
        </ol>
        <Link href={`/${locale}/${aProposSlug[locale]}`} className="mt-4 md:mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ember-300 hover:text-ember-200">
          {t.aPropos} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  if (lieu === "tour") {
    return (
      <div className={cadre}>
        {entete}
        <h2 className="mt-3 md:mt-5 max-w-2xl font-display text-4xl leading-[1.1] font-semibold text-balance text-bone-50">{t.tourTitre}</h2>
        <p className="mt-2 md:mt-4 max-w-xl text-lg leading-relaxed text-bone-100">{t.tourTexte}</p>
        <div className="mt-4 md:mt-8">
          <ButtonLink href={`/${locale}/labs`} withArrow>
            {t.tourCta}
          </ButtonLink>
        </div>
      </div>
    );
  }

  // The square: the guide holds out his tablet.
  return (
    <div className={cadre}>
      <div>
        {entete}
        <h2 className="mt-3 md:mt-5 font-display text-4xl leading-[1.1] font-semibold text-balance text-bone-50">{t.placeTitre}</h2>
        <p className="mt-2 md:mt-4 max-w-md text-lg leading-relaxed text-bone-100">{t.placeTexte}</p>
        <div className="mt-4 md:mt-8">
          <ButtonLink href={`/${locale}/contact`} withArrow>
            {dict.nav.cta}
          </ButtonLink>
        </div>
      </div>
      <Diagnostic locale={locale} />
    </div>
  );
}
