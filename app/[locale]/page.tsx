import { notFound } from "next/navigation";
import { Ville } from "@/components/sections/ville/ville";
import { Clients } from "@/components/sections/clients";
import { KeyFigures } from "@/components/sections/key-figures";
import { Faq } from "@/components/sections/faq";
import { getDictionary } from "@/lib/content";
import { isLocale, SITE_URL, CONTACT_EMAIL } from "@/lib/i18n";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Hephera",
    description: dict.meta.description,
    url: `${SITE_URL}/${locale}`,
    email: CONTACT_EMAIL,
    knowsLanguage: ["fr", "en"],
    serviceType: Object.values(dict.serviceContent).map(
      (service) => service.name,
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* The journey through the Hephera city (hero, services, method, Labs, contact),
          then the sections that read best as a page. */}
      <Ville locale={locale} dict={dict} />
      <Clients dict={dict} />
      <KeyFigures dict={dict} />
      <Faq
        eyebrow={dict.faq.eyebrow}
        title={dict.faq.title}
        items={dict.faq.items}
      />
    </>
  );
}
