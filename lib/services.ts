import type { Locale } from "./i18n";

export const serviceKeys = ["web", "seo", "automation", "consulting"] as const;

export type ServiceKey = (typeof serviceKeys)[number];

/** Slugs are localized so each language gets its own SEO-friendly URL. */
export const serviceSlugs: Record<Locale, Record<ServiceKey, string>> = {
  fr: {
    web: "developpement-web",
    seo: "seo",
    automation: "automatisation",
    consulting: "conseil",
  },
  en: {
    web: "web-development",
    seo: "seo",
    automation: "automation",
    consulting: "consulting",
  },
};

export function serviceHref(locale: Locale, key: ServiceKey) {
  return `/${locale}/services/${serviceSlugs[locale][key]}`;
}

export function serviceKeyFromSlug(
  locale: Locale,
  slug: string,
): ServiceKey | undefined {
  return serviceKeys.find((key) => serviceSlugs[locale][key] === slug);
}
