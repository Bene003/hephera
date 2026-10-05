import type { Locale } from "./i18n";

/** The founder page's address, translated. Kept apart from its text so the
 *  header (a client component) can link to it without shipping that text. */
export const aProposSlug: Record<Locale, string> = { fr: "a-propos", en: "about" };
