import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicesGrid } from "@/components/sections/services-grid";
import { Method } from "@/components/sections/method";
import { FinalCta } from "@/components/sections/final-cta";
import { getDictionary } from "@/lib/content";
import { isLocale, locales } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/services">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);

  return {
    title: dict.servicesIndex.title,
    description: dict.servicesIndex.subtitle,
    alternates: {
      canonical: `/${locale}/services`,
      languages: { fr: "/fr/services", en: "/en/services" },
    },
  };
}

export default async function ServicesPage({
  params,
}: PageProps<"/[locale]/services">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <>
      <ServicesGrid
        locale={locale}
        dict={dict}
        heading={{
          eyebrow: dict.servicesIndex.eyebrow,
          title: dict.servicesIndex.title,
          subtitle: dict.servicesIndex.subtitle,
        }}
      />
      <Method dict={dict} />
      <FinalCta locale={locale} dict={dict} />
    </>
  );
}
