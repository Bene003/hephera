import { ButtonLink, Container, ForgeGlow } from "../ui";
import OrbitingCirclesGlobe from "../ui/orbiting-circles-02";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/content";

export function Hero({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { hero } = dict;

  return (
    <section className="relative overflow-hidden">
      <ForgeGlow />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-anvil [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)]"
      />

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0"
        >
          <OrbitingCirclesGlobe />
        </div>

        <Container className="relative z-10 pt-20 pb-36 sm:pt-24 md:pt-28 md:pb-52">
          <div className="relative mx-auto max-w-3xl text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-24 -inset-y-16 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(7,7,10,0.92),rgba(7,7,10,0.7)_52%,transparent_78%)]"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[0.7rem] font-medium tracking-[0.16em] text-bone-300 uppercase">
              <span className="size-1.5 rounded-full bg-ember-500 shadow-[0_0_12px_2px_rgba(255,122,24,0.8)]" />
              {hero.eyebrow}
            </span>

            <h1 className="mt-8 font-display text-4xl leading-[1.08] font-semibold text-balance text-bone-50 sm:text-6xl">
              {hero.titleStart}{" "}
              <span className="text-molten">{hero.titleAccent}</span>{" "}
              {hero.titleEnd}
            </h1>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink href={`/${locale}/contact`} withArrow>
                {hero.primaryCta}
              </ButtonLink>
              <ButtonLink href={`/${locale}#services`} variant="ghost">
                {hero.secondaryCta}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </div>

      <div className="relative border-y border-white/8 bg-ink-900/50 py-4">
        <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10">
            {[...hero.marquee, ...hero.marquee].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="flex shrink-0 items-center gap-10 font-display text-xs tracking-[0.2em] text-bone-500 uppercase"
              >
                {item}
                <span className="size-1 rounded-full bg-ember-500/60" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
