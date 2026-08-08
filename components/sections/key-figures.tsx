import { Container, SectionHeading } from "../ui";
import { Reveal } from "../reveal";
import type { Dictionary } from "@/lib/content";

export function KeyFigures({ dict }: { dict: Dictionary }) {
  const { keyFigures } = dict;

  return (
    <section
      id="chiffres"
      className="relative scroll-mt-24 overflow-hidden border-y border-white/8 bg-ink-900/40 py-24 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,122,24,0.1),transparent_65%)] blur-2xl"
      />

      <Container className="relative">
        <Reveal>
          <SectionHeading
            eyebrow={keyFigures.eyebrow}
            title={keyFigures.title}
            subtitle={keyFigures.subtitle}
            align="center"
          />
        </Reveal>

        <dl className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {keyFigures.items.map((item, index) => (
            <Reveal key={item.label} delay={index * 70}>
              <div className="card-forge h-full rounded-2xl p-7">
                <dt className="font-display text-4xl leading-none font-semibold text-molten">
                  {item.value}
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-bone-300">
                  {item.label}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
