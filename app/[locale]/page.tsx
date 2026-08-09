import { notFound } from "next/navigation";
import { Hero } from "@/components/sections/hero";
import { Manifesto } from "@/components/sections/manifesto";
import { Clients } from "@/components/sections/clients";
import { ServicesStack } from "@/components/sections/services-stack";
import { Method } from "@/components/sections/method";
import { Philosophy } from "@/components/sections/philosophy";
import { KeyFigures } from "@/components/sections/key-figures";
import { Values } from "@/components/sections/values";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { getDictionary } from "@/lib/content";
import { isLocale, SITE_URL } from "@/lib/i18n";

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
    email: "contact@hephera.com",
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
      <Hero locale={locale} dict={dict} />
      <Manifesto dict={dict} />
      <ServicesStack locale={locale} dict={dict} id="services" />
      <Method dict={dict} />
      <Clients dict={dict} />
      <Philosophy dict={dict} />
      <KeyFigures dict={dict} />
      <Values dict={dict} />
      <Faq
        eyebrow={dict.faq.eyebrow}
        title={dict.faq.title}
        items={dict.faq.items}
      />
      <FinalCta locale={locale} dict={dict} />
    </>
  );
}
