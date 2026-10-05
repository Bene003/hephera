import { aProposSlug } from "./a-propos-slug";
import type { Locale } from "./i18n";
import { serviceKeyFromSlug, serviceSlugs } from "./services";

/** Rewrites the current path for another locale, translating service slugs. */
export function switchLocalePath(
  pathname: string,
  current: Locale,
  target: Locale,
): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return `/${target}`;

  segments[0] = target;

  // The founder page has a translated address: /fr/a-propos <-> /en/about.
  if (segments[1] === aProposSlug[current]) segments[1] = aProposSlug[target];

  if (segments[1] === "services" && segments[2]) {
    const key = serviceKeyFromSlug(current, segments[2]);
    if (key) segments[2] = serviceSlugs[target][key];
  }

  return `/${segments.join("/")}`;
}
