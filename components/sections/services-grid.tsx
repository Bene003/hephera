import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container, SectionHeading } from "../ui";
import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { serviceHref, serviceKeys } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/content";

export function ServicesGrid({
  locale,
  dict,
  heading,
  id,
}: {
  locale: Locale;
  dict: Dictionary;
  heading?: { eyebrow: string; title: string; subtitle: string };
  id?: string;
}) {
  const head = heading ?? {
    eyebrow: dict.services.eyebrow,
    title: dict.services.title,
    subtitle: dict.services.subtitle,
  };

  return (
    <section id={id} className="relative scroll-mt-24 py-24 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={head.eyebrow}
            title={head.title}
            subtitle={head.subtitle}
          />
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {serviceKeys.map((key, index) => {
            const service = dict.serviceContent[key];
            return (
              <Reveal key={key} delay={index * 90}>
                <Link
                  href={serviceHref(locale, key)}
                  className="card-forge group flex h-full flex-col rounded-2xl p-7 sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex size-11 items-center justify-center rounded-xl border border-ember-500/25 bg-ember-500/10 text-ember-400">
                      <Icon name={service.icon} className="size-5" />
                    </span>
                    <ArrowUpRight className="size-5 text-bone-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ember-400" />
                  </div>

                  <h3 className="mt-6 font-display text-xl font-semibold text-bone-50">
                    {service.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-ember-400/90">
                    {service.tagline}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-bone-300">
                    {service.short}
                  </p>

                  <ul className="mt-6 flex flex-wrap gap-2">
                    {service.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-bone-500"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <span className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-bone-100 transition-colors group-hover:text-ember-300">
                    {dict.services.cta}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
