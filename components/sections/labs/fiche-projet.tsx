"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, X } from "lucide-react";

import { ButtonLink } from "@/components/ui";
import type { Locale } from "@/lib/i18n";
import { labs, projets, type ProjetId } from "@/lib/labs";
import { BadgeStatut } from "./badge-statut";

/**
 * A product's full sheet, in a side panel. Native <dialog>: the browser traps
 * focus, closes on Escape and gives focus back to the button that opened it.
 */
export function FicheProjet({ locale, id, onFermer }: { locale: Locale; id: ProjetId | null; onFermer: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = labs[locale];
  const projet = projets.find((p) => p.id === id);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (id && !d.open) d.showModal();
    if (!id && d.open) d.close();
  }, [id]);

  const p = projet ? t.projets[projet.id] : null;

  return (
    <dialog
      ref={ref}
      onClose={onFermer}
      onClick={(e) => e.target === ref.current && onFermer()}   // click on the backdrop
      aria-labelledby="fiche-titre"
      className="labs-fiche fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(34rem,100vw)] max-w-none overflow-y-auto border-l border-white/10 bg-ink-900 p-0 text-bone-100"
    >
      {projet && p && (
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-wide text-bone-300">{p.categorie}</p>
              <h2 id="fiche-titre" className="mt-1 font-display text-3xl font-semibold text-bone-50">{p.nom}</h2>
            </div>
            <button
              type="button"
              onClick={onFermer}
              aria-label={t.fermer}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-white/12 text-bone-100 transition-colors hover:border-ember-400/40 focus-visible:outline-2 focus-visible:outline-ember-400"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="mt-4">
            <BadgeStatut statut={projet.statut} libelle={t.statuts[projet.statut].nom} titre={t.statuts[projet.statut].detail} />
          </div>
          <p className="mt-5 text-lg leading-relaxed text-bone-100">{p.accroche}</p>

          <section className="mt-8">
            <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-ember-300 uppercase">{t.problemeTitre}</h3>
            <p className="mt-2 leading-relaxed text-bone-300">{p.probleme}</p>
          </section>
          <section className="mt-6">
            <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-ember-300 uppercase">{t.pourQuiTitre}</h3>
            <p className="mt-2 leading-relaxed text-bone-300">{p.pourQui}</p>
          </section>
          <section className="mt-6">
            <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-ember-300 uppercase">{t.commentTitre}</h3>
            <ol className="labs-etapes mt-4 space-y-4">
              {p.etapes.map((etape, n) => (
                <li key={etape} className="relative flex gap-4">
                  <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-ember-400/40 bg-ink-850 font-display text-xs text-ember-300 tabular-nums">
                    {n + 1}
                  </span>
                  <p className="pt-1 leading-relaxed text-bone-100">{etape}</p>
                </li>
              ))}
            </ol>
          </section>
          <section className="mt-6">
            <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-ember-300 uppercase">{t.technologies}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {projet.technologies.map((tech) => (
                <li key={tech} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-bone-300">{tech}</li>
              ))}
            </ul>
          </section>
          <section className="mt-6">
            <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-ember-300 uppercase">{t.etatTitre}</h3>
            <p className="mt-2 leading-relaxed text-bone-300">{p.etat}</p>
          </section>

          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={`/${locale}/contact`} withArrow>{t.cta}</ButtonLink>
            {projet.lien && (
              <a
                href={projet.lien}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-6 py-3 text-sm font-medium text-bone-100 transition-colors hover:border-ember-400/40"
              >
                {t.ouvrirDemo} <ArrowUpRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
