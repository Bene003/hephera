import type { MetadataRoute } from "next";
import { locales, SITE_URL } from "@/lib/i18n";
import { serviceKeys, serviceSlugs } from "@/lib/services";
import { aProposSlug } from "@/lib/a-propos-slug";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date();

  for (const locale of locales) {
    entries.push(
      {
        url: `${SITE_URL}/${locale}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 1,
      },
      {
        url: `${SITE_URL}/${locale}/contact`,
        lastModified,
        changeFrequency: "yearly",
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/${locale}/${aProposSlug[locale]}`,
        lastModified,
        changeFrequency: "yearly",
        priority: 0.6,
      },
    );

    for (const key of serviceKeys) {
      entries.push({
        url: `${SITE_URL}/${locale}/services/${serviceSlugs[locale][key]}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
