import Link from "next/link";
import { Wordmark } from "./logo";
import { CONTACT_EMAIL, type Locale } from "@/lib/i18n";
import { serviceHref, serviceKeys } from "@/lib/services";
import type { Dictionary } from "@/lib/content";

export function SiteFooter({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { footer } = dict;

  return (
    <footer className="relative mt-auto border-t border-white/8 bg-ink-900">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href={`/${locale}`} className="flex items-center">
              <Wordmark />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-bone-500">
              {footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-bone-300 uppercase">
              {footer.servicesTitle}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {serviceKeys.map((key) => (
                <li key={key}>
                  <Link
                    href={serviceHref(locale, key)}
                    className="text-sm text-bone-500 transition-colors hover:text-ember-300"
                  >
                    {dict.serviceContent[key].name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-bone-300 uppercase">
              {footer.studioTitle}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: `/${locale}#methode`, label: footer.links.method },
                {
                  href: `/${locale}#philosophie`,
                  label: footer.links.philosophy,
                },
                { href: `/${locale}#valeurs`, label: footer.links.values },
                { href: `/${locale}#faq`, label: footer.links.faq },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-bone-500 transition-colors hover:text-ember-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-xs font-semibold tracking-[0.18em] text-bone-300 uppercase">
              {footer.contactTitle}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-bone-500">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="transition-colors hover:text-ember-300"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>{footer.location}</li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="transition-colors hover:text-ember-300"
                >
                  {dict.nav.cta}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="hr-metal mt-14" />

        <div className="mt-6 flex flex-col gap-3 text-xs text-bone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Hephera. {footer.rights}
          </p>
          <p className="font-display tracking-[0.18em] uppercase">Built with intent</p>
        </div>
      </div>
    </footer>
  );
}
