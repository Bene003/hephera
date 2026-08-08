import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Mail, MapPin } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { Container, Eyebrow, ForgeGlow } from "@/components/ui";
import { getDictionary } from "@/lib/content";
import { CONTACT_EMAIL, isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);

  return {
    title: dict.contact.title,
    description: dict.contact.subtitle,
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { fr: "/fr/contact", en: "/en/contact" },
    },
  };
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const { contact } = dict;

  const info = [
    {
      icon: Mail,
      label: contact.info.emailLabel,
      value: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
    },
    {
      icon: MapPin,
      label: contact.info.locationLabel,
      value: contact.info.locationValue,
    },
    {
      icon: Clock,
      label: contact.info.hoursLabel,
      value: contact.info.hoursValue,
    },
  ];

  return (
    <section className="relative overflow-hidden">
      <ForgeGlow />
      <Container className="relative py-20 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>{contact.eyebrow}</Eyebrow>
            <h1 className="mt-5 font-display text-4xl leading-[1.1] font-semibold text-balance text-bone-50 sm:text-5xl">
              {contact.title}
            </h1>
            <p className="mt-5 leading-relaxed text-bone-300">
              {contact.subtitle}
            </p>

            <dl className="mt-10 space-y-6">
              {info.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-ember-500/25 bg-ember-500/10 text-ember-400">
                    <item.icon className="size-4.5" strokeWidth={1.6} />
                  </span>
                  <div>
                    <dt className="text-xs font-medium tracking-[0.14em] text-bone-500 uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-bone-100">
                      {item.href ? (
                        <a
                          href={item.href}
                          className="transition-colors hover:text-ember-300"
                        >
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <ContactForm form={contact.form} />
        </div>
      </Container>
    </section>
  );
}
