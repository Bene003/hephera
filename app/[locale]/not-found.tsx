import { ButtonLink, Container, ForgeGlow } from "@/components/ui";
import { LogoMark } from "@/components/logo";
import { getDictionary } from "@/lib/content";
import { defaultLocale } from "@/lib/i18n";

export default function NotFound() {
  const dict = getDictionary(defaultLocale);

  return (
    <section className="relative overflow-hidden">
      <ForgeGlow />
      <Container className="relative flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
        <LogoMark className="size-14" />
        <p className="mt-8 font-display text-6xl font-semibold text-molten">
          404
        </p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-bone-50">
          {dict.notFound.title}
        </h1>
        <p className="mt-3 max-w-sm text-bone-300">{dict.notFound.body}</p>
        <ButtonLink href={`/${defaultLocale}`} className="mt-9" withArrow>
          {dict.notFound.cta}
        </ButtonLink>
      </Container>
    </section>
  );
}
