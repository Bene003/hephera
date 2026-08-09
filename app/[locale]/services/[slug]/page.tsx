import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";

import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { ServiceProblems } from "@/components/sections/service-problems";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import {
  ButtonLink,
  Container,
  Eyebrow,
  ForgeGlow,
  SectionHeading,
} from "@/components/ui";
import { ServiceHeroLoop } from "@/components/ui/service-hero-loop";
import { getDictionary } from "@/lib/content";
import { isLocale, locales } from "@/lib/i18n";
import {
  serviceHref,
  serviceKeyFromSlug,
  serviceKeys,
  serviceSlugs,
} from "@/lib/services";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    serviceKeys.map((key) => ({ locale, slug: serviceSlugs[locale][key] })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const key = serviceKeyFromSlug(locale, slug);
  if (!key) return {};

  const service = getDictionary(locale).serviceContent[key];

  return {
    title: `${service.name} — ${service.tagline}`,
    description: service.short,
    alternates: {
      canonical: `/${locale}/services/${slug}`,
      languages: {
        fr: `/fr/services/${serviceSlugs.fr[key]}`,
        en: `/en/services/${serviceSlugs.en[key]}`,
      },
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: PageProps<"/[locale]/services/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const key = serviceKeyFromSlug(locale, slug);
  if (!key) notFound();

  const dict = getDictionary(locale);
  const service = dict.serviceContent[key];
  const labels = dict.serviceDetail;
  const others = serviceKeys.filter((other) => other !== key);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/8">
        <ForgeGlow />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-anvil [mask-image:radial-gradient(ellipse_60%_60%_at_50%_20%,black,transparent)]"
        />
        <Container className="relative pt-16 pb-20 sm:pt-20 sm:pb-24">
          <Link
            href={`/${locale}#services`}
            className="inline-flex items-center gap-2 text-xs tracking-wide text-bone-500 transition-colors hover:text-ember-300"
          >
            <ArrowLeft className="size-3.5" />
            {labels.backToServices}
          </Link>

          {/* The loop stays after the copy in DOM order: at `lg` the grid puts
              it on the right, below that it is hidden. No `order` juggling, and
              the <h1> keeps its place as the first thing announced. */}
          <div className="mt-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="max-w-3xl">
              <span className="inline-flex size-12 items-center justify-center rounded-xl border border-ember-500/25 bg-ember-500/10 text-ember-400">
                <Icon name={service.icon} className="size-6" />
              </span>
              <h1 className="mt-7 font-display text-4xl leading-[1.1] font-semibold text-balance text-bone-50 sm:text-5xl">
                {service.name}
              </h1>
              <p className="mt-3 font-display text-lg text-ember-400">
                {service.tagline}
              </p>
              <p className="mt-6 text-[1.05rem] leading-relaxed text-bone-300">
                {service.intro}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={`/${locale}/contact`} withArrow>
                  {dict.nav.cta}
                </ButtonLink>
              </div>
            </div>

            <ServiceHeroLoop kind={key} />
          </div>
        </Container>
      </section>

      <section className="py-24 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading title={labels.includedTitle} />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {service.included.map((item, index) => (
              <Reveal key={item.title} delay={index * 80}>
                <div className="card-forge h-full rounded-2xl p-7">
                  <h3 className="font-display text-lg font-semibold text-bone-50">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-bone-300">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <ServiceProblems serviceKey={key} dict={dict} />

      <section className="border-y border-white/8 bg-ink-900/40 py-24 sm:py-28">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2">
            <Reveal>
              <Eyebrow>{service.name}</Eyebrow>
              <h2 className="mt-5 font-display text-3xl leading-[1.15] font-semibold text-balance text-bone-50 sm:text-4xl">
                {labels.outcomesTitle}
              </h2>
              <ul className="mt-8 space-y-4">
                {service.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-ember-500/15 text-ember-400">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="text-bone-200">{outcome}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120}>
              <h2 className="font-display text-xl font-semibold text-bone-50">
                {labels.processTitle}
              </h2>
              <ol className="mt-8 space-y-px overflow-hidden rounded-2xl border border-white/8 bg-white/8">
                {service.process.map((step, index) => (
                  <li key={step.title} className="bg-ink-950 p-6">
                    <div className="flex items-baseline gap-4">
                      <span className="font-display text-sm font-semibold text-ember-500/70">
                        0{index + 1}
                      </span>
                      <div>
                        <h3 className="font-display font-semibold text-bone-50">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-bone-300">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="py-24 sm:py-28">
        <Container>
          <Faq title={labels.faqTitle} items={service.faq} bare />
        </Container>
      </section>

      <section className="border-t border-white/8 py-20">
        <Container>
          <Reveal>
            <h2 className="font-display text-xs font-semibold tracking-[0.18em] text-bone-500 uppercase">
              {labels.otherServices}
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {others.map((other, index) => (
              <Reveal key={other} delay={index * 80}>
                <Link
                  href={serviceHref(locale, other)}
                  className="card-forge group flex h-full flex-col rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl border border-ember-500/25 bg-ember-500/10 text-ember-400">
                      <Icon
                        name={dict.serviceContent[other].icon}
                        className="size-4.5"
                      />
                    </span>
                    <ArrowUpRight className="size-4 text-bone-500 transition-colors group-hover:text-ember-400" />
                  </div>
                  <h3 className="mt-5 font-display font-semibold text-bone-50">
                    {dict.serviceContent[other].name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-bone-500">
                    {dict.serviceContent[other].short}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <FinalCta locale={locale} dict={dict} />
    </>
  );
}
