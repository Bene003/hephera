import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Labs } from "@/components/sections/labs/labs";
import { isLocale, locales, SITE_URL } from "@/lib/i18n";
import { labs, projets } from "@/lib/labs";

// Same address in both languages: /fr/labs and /en/labs.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/labs">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = labs[locale];
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: { canonical: `/${locale}/labs`, languages: { fr: "/fr/labs", en: "/en/labs" } },
    openGraph: { images: ["/labs/tour/v3/P0.jpg"] },
  };
}

export default async function Page({ params }: PageProps<"/[locale]/labs">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = labs[locale];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Hephera Labs",
    url: `${SITE_URL}/${locale}/labs`,
    itemListElement: projets.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: t.projets[p.id].nom,
        description: t.projets[p.id].accroche,
        applicationCategory: t.projets[p.id].categorie,
        ...(p.lien ? { url: p.lien } : {}),
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Labs locale={locale} />
    </>
  );
}
