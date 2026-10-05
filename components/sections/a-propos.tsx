import Image from "next/image";

import { ButtonLink, Container, Eyebrow, ForgeGlow } from "@/components/ui";
import { aPropos } from "@/lib/a-propos";
import type { Locale } from "@/lib/i18n";

/** The founder page, shared by /fr/a-propos and /en/about. */
export function APropos({ locale }: { locale: Locale }) {
  const t = aPropos[locale];

  return (
    <>
      <section className="relative overflow-hidden">
        <ForgeGlow />
        <Container className="relative py-20 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
            <div>
              <Eyebrow>{t.eyebrow}</Eyebrow>
              <h1 className="mt-5 font-display text-4xl leading-[1.1] font-semibold text-balance text-bone-50 sm:text-5xl">
                {t.title} <span className="text-ember-400">{t.titleAccent}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone-300">{t.lead}</p>
            </div>

            {/* A small portrait: the cut-out sits on a warm glow so its
                transparent edges read as intended, not as a missing frame. */}
            <div className="relative mx-auto w-56 sm:w-64 lg:w-72">
              <span
                aria-hidden
                className="absolute inset-x-6 bottom-0 top-10 rounded-full bg-ember-500/25 blur-3xl"
              />
              <div className="relative aspect-[550/700] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-ink-800 to-ink-900">
                <Image
                  src="/images/eben.png"
                  alt={t.photoAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 18rem, 16rem"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-white/8">
        <Container className="py-20 sm:py-24">
          <div className="grid gap-14 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
            <div>
              <h2 className="font-display text-2xl font-semibold text-bone-50 sm:text-3xl">
                {t.storyTitle}
              </h2>
              <div className="mt-6 space-y-5 leading-relaxed text-bone-300">
                {t.story.map((paragraphe) => (
                  <p key={paragraphe.slice(0, 32)}>{paragraphe}</p>
                ))}
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-6 self-start border-t border-white/10 pt-8 lg:grid-cols-1 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
              {t.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs font-medium tracking-[0.14em] text-bone-500 uppercase">
                    {stat.label}
                  </dt>
                  <dd className="mt-2 font-display text-3xl font-semibold text-ember-400 sm:text-4xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <section className="border-t border-white/8 bg-ink-900/40">
        <Container className="py-20 sm:py-24">
          <h2 className="font-display text-2xl font-semibold text-bone-50 sm:text-3xl">
            {t.principlesTitle}
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-3">
            {t.principles.map((principe, i) => (
              <li key={principe.title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
                <span className="font-display text-xs tracking-[0.2em] text-ember-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-bone-50">{principe.title}</h3>
                <p className="mt-2 leading-relaxed text-bone-300">{principe.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="relative overflow-hidden border-t border-white/8">
        <ForgeGlow />
        <Container className="relative py-20 text-center sm:py-24">
          <h2 className="font-display text-3xl font-semibold text-balance text-bone-50 sm:text-4xl">
            {t.ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-lg leading-relaxed text-bone-300">{t.ctaBody}</p>
          <ButtonLink href={`/${locale}/contact`} withArrow className="mt-8">
            {t.cta}
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
