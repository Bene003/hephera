import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary } from "@/lib/content";
import { isLocale, locales, SITE_URL } from "@/lib/i18n";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.meta.title,
      template: "%s · Hephera",
    },
    description: dict.meta.description,
    applicationName: "Hephera",
    alternates: {
      canonical: `/${locale}`,
      languages: { fr: "/fr", en: "/en", "x-default": "/fr" },
    },
    openGraph: {
      type: "website",
      siteName: "Hephera",
      title: dict.meta.title,
      description: dict.meta.description,
      locale: locale === "fr" ? "fr_CA" : "en_CA",
      url: `/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${sora.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink-950">
        {/* The page slides aside as one piece when the menu opens
            (see .page-shell in globals.css and SiteHeader). */}
        <div id="page-shell" className="page-shell flex flex-1 flex-col">
          <SiteHeader locale={locale} nav={dict.nav} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} dict={dict} />
        </div>
      </body>
    </html>
  );
}
