import { Icon } from "../icons";
import { ScrollMorphServices } from "../ui/scroll-morph-services";
import { ServiceLoop } from "../ui/service-card-loops";
import { serviceHref, serviceKeys } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/content";

export function ServicesStack({
  locale,
  dict,
  id,
}: {
  locale: Locale;
  dict: Dictionary;
  id?: string;
}) {
  const cards = serviceKeys.map((key) => {
    const service = dict.serviceContent[key];
    return {
      id: key,
      title: service.name,
      tagline: service.tagline,
      description: service.short,
      href: serviceHref(locale, key),
      icon: <Icon name={service.icon} className="size-5" />,
      loop: <ServiceLoop kind={key} />,
    };
  });

  return (
    <section id={id} className="relative scroll-mt-24">
      <ScrollMorphServices
        items={cards}
        eyebrow={dict.services.eyebrow}
        title={dict.services.title}
        subtitle={dict.services.subtitle}
        scrollHint={dict.services.scrollHint}
        cta={dict.services.cta}
        closeLabel={dict.nav.close}
        clickHint={dict.services.clickHint}
      />
    </section>
  );
}
