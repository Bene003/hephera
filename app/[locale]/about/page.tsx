import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { APropos } from "@/components/sections/a-propos";
import { aPropos, aProposSlug } from "@/lib/a-propos";

// English-only address; the French page lives at /fr/a-propos (lib/a-propos.ts).
export function generateStaticParams() {
  return [{ locale: "en" }];
}
export const dynamicParams = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = aPropos.en;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: "/en/about",
      languages: { fr: `/fr/${aProposSlug.fr}`, en: `/en/${aProposSlug.en}` },
    },
  };
}

export default async function Page({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  return <APropos locale="en" />;
}
