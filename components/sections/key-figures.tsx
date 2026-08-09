import { Container, SectionHeading } from "../ui";
import { KeyFiguresBoard } from "../ui/key-figures-board";
import { Reveal } from "../reveal";
import type { Dictionary } from "@/lib/content";

export function KeyFigures({ dict }: { dict: Dictionary }) {
  const { keyFigures } = dict;

  return (
    <section
      id="chiffres"
      className="relative scroll-mt-24 overflow-hidden border-y border-white/8 bg-ink-900/40 py-24 sm:py-28"
    >
      <Container className="relative">
        <Reveal>
          <SectionHeading
            eyebrow={keyFigures.eyebrow}
            title={keyFigures.title}
            subtitle={keyFigures.subtitle}
            align="center"
          />
        </Reveal>

        <KeyFiguresBoard items={keyFigures.items} />
      </Container>
    </section>
  );
}
