import { HeroConversation } from "./hero-conversation";
import { HeroScene } from "./hero-scene";
import { CONTACT_EMAIL, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/content";

/**
 * The hero talks: the title typed out as a message and the ways forward
 * offered as replies, over a robot the mouse turns.
 */
export function Hero({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { hero } = dict;
  const title = `${hero.titleStart} ${hero.titleAccent} ${hero.titleEnd}`;

  return (
    <section className="relative">
      {/* The background is the wall colour sampled from the video: where the
          video is smaller than the hero, on portrait phones, its edges melt
          into it. It also keeps the black copy readable while the video loads
          or if it never does. The text sits on the left of wide screens and
          under the robot on portrait phones. */}
      <div className="relative flex h-[calc(100svh-4.5rem)] min-h-[34rem] flex-col justify-center overflow-hidden bg-[#979694] px-5 font-['Helvetica_Neue',Helvetica,Arial,sans-serif] sm:px-8 md:px-10 max-lg:portrait:justify-end max-lg:portrait:pb-12">
        <HeroScene />

        <div className="relative z-10 max-w-xl">
          <h1 className="sr-only">{title}</h1>
          <p className="sr-only">{hero.question}</p>
          <HeroConversation
            text={`${title} ${hero.question}`}
            pills={[
              { label: hero.primaryCta, href: `/${locale}/contact` },
              { label: hero.secondaryCta, href: `/${locale}#services` },
              { label: hero.methodCta, href: `/${locale}#methode` },
              { label: hero.referencesCta, href: `/${locale}#references` },
            ]}
            email={CONTACT_EMAIL}
            emailLabel={hero.emailLabel}
            copiedLabel={hero.copied}
          />
        </div>
      </div>

      <div className="relative border-y border-white/8 bg-ink-900/50 py-6 md:py-9">
        <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div className="flex shrink-0 animate-marquee items-center gap-12 pr-12 md:gap-16 md:pr-16">
            {[...hero.marquee, ...hero.marquee].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="flex shrink-0 items-center gap-12 font-display text-base tracking-[0.2em] text-bone-300 uppercase md:gap-16 md:text-2xl"
              >
                {item}
                <span className="size-1.5 rounded-full bg-ember-500/70 md:size-2" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
