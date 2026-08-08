import { ButtonLink, Container, Eyebrow, ForgeGlow } from "../ui";
import { Reveal } from "../reveal";
import { CONTACT_EMAIL, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/content";

export function FinalCta({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { finalCta } = dict;

  return (
    <section className="relative overflow-hidden border-t border-white/8 py-24 sm:py-32">
      <ForgeGlow />
      <Container className="relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center">
            <Eyebrow>{finalCta.eyebrow}</Eyebrow>
          </div>
          <h2 className="mt-6 font-display text-3xl leading-[1.12] font-semibold text-balance text-bone-50 sm:text-5xl">
            {finalCta.title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-bone-300">
            {finalCta.subtitle}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={`/${locale}/contact`} withArrow>
              {finalCta.primaryCta}
            </ButtonLink>
            <ButtonLink href={`mailto:${CONTACT_EMAIL}`} variant="ghost">
              {finalCta.secondaryCta}
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
