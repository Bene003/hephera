import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { APropos } from "@/components/sections/a-propos";
import { aPropos, aProposSlug } from "@/lib/a-propos";

// French-only address; the English page lives at /en/about (lib/a-propos.ts).
export function generateStaticParams() {
  return [{ locale: "fr" }];
}
export const dynamicParams = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = aPropos.fr;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: "/fr/a-propos",
      languages: { fr: `/fr/${aProposSlug.fr}`, en: `/en/${aProposSlug.en}` },
    },
  };
}

export default async function Page({ params }: PageProps<"/[locale]/a-propos">) {
  const { locale } = await params;
  if (locale !== "fr") notFound();
  return <APropos locale="fr" />;
}
